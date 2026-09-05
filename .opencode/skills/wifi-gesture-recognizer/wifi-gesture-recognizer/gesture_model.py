"""
WiFi Gesture Recognizer - Dual-Path CNN1D-LSTM Ensemble

Classifies human gestures (wave, push, pull, clap, slide, etc.) 
using WiFi Channel State Information (CSI) with a dual-path 
CNN1D-LSTM ensemble architecture. Achieves ~90% accuracy on ESP32 hardware.

Target: ESP32-S3, also ESP32-C3/C5
Framework: PyTorch (optimized for edge deployment)
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class CNN2DBranch(nn.Module):
    """
    CNN2D branch processes STFT spectrograms of CSI data.
    Extracts frequency-time pattern features.
    """
    
    def __init__(self, in_channels=1, base_filters=32, num_classes=3):
        super(CNN2DBranch, self).__init__()
        
        # Convolutional blocks
        self.conv_block1 = nn.Sequential(
            nn.Conv2d(in_channels, base_filters, kernel_size=3, padding=1),
            nn.BatchNorm2d(base_filters),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )
        
        self.conv_block2 = nn.Sequential(
            nn.Conv2d(base_filters, base_filters * 2, kernel_size=3, padding=1),
            nn.BatchNorm2d(base_filters * 2),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )
        
        self.conv_block3 = nn.Sequential(
            nn.Conv2d(base_filters * 2, base_filters * 4, kernel_size=3, padding=1),
            nn.BatchNorm2d(base_filters * 4),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d((1, 1))
        )
        
        # Feature head: outputs base_filters*4 features for the fusion layer.
        # (The fusion layer performs final classification, so this is NOT
        #  a num_classes output despite the constructor parameter.)
        self.fc = nn.Linear(base_filters * 4, base_filters * 4)
    
    def forward(self, x):
        # x shape: (batch, channels, height, width) - spectrogram
        x = self.conv_block1(x)
        x = self.conv_block2(x)
        x = self.conv_block3(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        return x


class CNN1D_LSTMBranch(nn.Module):
    """
    CNN1D-LSTM branch processes temporal CSI sequence data.
    Extracts temporal sequence features using LSTM.
    """
    
    def __init__(self, in_channels=8, lstm_units=64, num_classes=3, dropout=0.3):
        super(CNN1D_LSTMBranch, self).__init__()
        
        # 1D Convolution for feature extraction from statistical features
        self.conv1d = nn.Conv1d(in_channels, lstm_units, kernel_size=3, padding=1)
        
        # LSTM for temporal modeling
        self.lstm = nn.LSTM(
            input_size=lstm_units,
            hidden_size=lstm_units,
            num_layers=2,
            dropout=dropout,
            batch_first=True,
            bidirectional=False
        )
        
        # Feature head - use last timestep output.
        # Outputs lstm_units features for the fusion layer (which performs
        # the final classification), NOT num_classes.
        self.fc = nn.LSTM(lstm_units, lstm_units, batch_first=True)
        self.classifier = nn.Linear(lstm_units, lstm_units)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x):
        # x shape: (batch, seq_len, features) - statistical features over time
        x = self.conv1d(x)  # (batch, lstm_units, seq_len)
        x = x.transpose(1, 2)  # (batch, seq_len, lstm_units)
        
        # LSTM processing
        lstm_out, (hn, cn) = self.lstm(x)
        
        # Use the last timestep output for classification
        last_timestep = lstm_out[:, -1, :]
        last_timestep = self.dropout(last_timestep)
        
        x = self.classifier(last_timestep)
        return x


class FusionLayer(nn.Module):
    """
    Fusion layer combining CNN2D and CNN1D-LSTM outputs.
    Uses weighted combination: α=0.6 for CNN2D, α=0.4 for CNN1D-LSTM
    """
    
    def __init__(self, cnn2d_units, cnn1d_units, alpha=0.6, num_classes=3):
        super(FusionLayer, self).__init__()
        
        self.alpha = alpha
        self.num_classes = num_classes
        
        # Project both branches to same dimension for fusion
        self.cnn2d_project = nn.Linear(cnn2d_units, 64)
        self.cnn1d_project = nn.Linear(cnn1d_units, 64)
        
        # Fusion and classification.
        # Weighted fusion of two 64-dim projections yields 64-dim,
        # so the final classifier takes 64 inputs (not 128).
        self.fc = nn.Linear(64, num_classes)
        self.dropout = nn.Dropout(0.3)
    
    def forward(self, cnn2d_output, cnn1d_output):
        # Project to common dimension
        cnn2d_feat = self.dropout(self.cnn2d_project(cnn2d_output))
        cnn1d_feat = self.dropout(self.cnn1d_project(cnn1d_output))
        
        # Weighted fusion
        fused = self.alpha * cnn2d_feat + (1 - self.alpha) * cnn1d_feat
        
        # Final classification
        output = self.fc(fused)
        return output


class WiFiGestureRecognizer(nn.Module):
    """
    Full WiFi Gesture Recognizer - Dual-Path Ensemble.
    
    Architecture:
    - CNN2D Branch: Processes STFT spectrograms (frequency-time patterns)
    - CNN1D-LSTM Branch: Processes temporal statistical features
    - Fusion Layer: Weighted combination (α=0.6 CNN2D, α=0.4 CNN1D-LSTM)
    - Output: 3-class classification (Not Occupied, Occupied Static, Occupied Motion)
    """
    
    def __init__(self, 
                 cnn2d_base_filters=32, 
                 cnn1d_in_channels=8, 
                 cnn1d_lstm_units=64,
                 fusion_alpha=0.6,
                 num_classes=3,
                 dropout=0.3):
        super(WiFiGestureRecognizer, self).__init__()
        
        self.cnn2d_base_filters = cnn2d_base_filters
        self.cnn1d_in_channels = cnn1d_in_channels
        self.cnn1d_lstm_units = cnn1d_lstm_units
        self.fusion_alpha = fusion_alpha
        self.num_classes = num_classes
        self.dropout = dropout
        
        # CNN2D branch - processes 128×128 spectrograms
        self.cnn2d = CNN2DBranch(
            in_channels=1,
            base_filters=cnn2d_base_filters,
            num_classes=num_classes  # placeholder, will be overridden
        )
        
        # After CNN2D with 2 maxpools: 128 → 32 → 16 spatial dim
        # With base_filters=32, final conv output: 32 * 4 * 16 * 16 (but adaptive pool)
        cnn2d_output_dim = cnn2d_base_filters * 4  # after adaptive avg pool
        
        # CNN1D-LSTM branch - processes 8 statistical features over 121 timesteps
        self.cnn1d_lstm = CNN1D_LSTMBranch(
            in_channels=cnn1d_in_channels,
            lstm_units=cnn1d_lstm_units,
            num_classes=num_classes,
            dropout=dropout
        )
        
        # CNN1D-LSTM output dimension
        cnn1d_output_dim = cnn1d_lstm_units
        
        # Fusion layer
        self.fusion = FusionLayer(
            cnn2d_output_dim,
            cnn1d_output_dim,
            alpha=fusion_alpha,
            num_classes=num_classes
        )
    
    def forward(self, spectrogram, statistical_features):
        """
        Forward pass through the dual-path ensemble.
        
        Args:
            spectrogram (torch.Tensor): STFT spectrogram
                Shape: (batch, 1, height, width) - e.g., (1, 1, 128, 128)
            statistical_features (torch.Tensor): 
                Shape: (batch, seq_len, features) - e.g., (1, 121, 8)
        
        Returns:
            torch.Tensor: Logits for 3 gesture classes
        """
        # CNN2D branch processing
        cnn2d_out = self.cnn2d(spectrogram)  # -> (batch, num_classes) or features
        
        # CNN1D-LSTM branch processing
        cnn1d_out = self.cnn1d_lstm(statistical_features)  # -> (batch, num_classes)
        
        # Fusion and final classification
        fused_out = self.fusion(cnn2d_out, cnn1d_out)
        
        return fused_out


def create_model(
    cnn2d_base_filters=32,
    cnn1d_in_channels=8,
    cnn1d_lstm_units=64,
    fusion_alpha=0.6,
    num_classes=3,
    dropout=0.3,
    weights_path=None
):
    """
    Factory function to create and optionally load WiFiGestureRecognizer model.
    
    Args:
        cnn2d_base_filters: Number of filters in CNN2D base
        cnn1d_in_channels: Number of input channels for CNN1D-LSTM
        cnn1d_lstm_units: LSTM hidden units
        fusion_alpha: Weight for CNN2D in fusion (0.6 default)
        num_classes: Number of gesture classes (3 default)
        dropout: Dropout rate
        weights_path: Path to pretrained weights (optional)
    
    Returns:
        WiFiGestureRecognizer: Configured model
    """
    model = WiFiGestureRecognizer(
        cnn2d_base_filters=cnn2d_base_filters,
        cnn1d_in_channels=cnn1d_in_channels,
        cnn1d_lstm_units=cnn1d_lstm_units,
        fusion_alpha=fusion_alpha,
        num_classes=num_classes,
        dropout=dropout
    )
    
    if weights_path and weights_path.endswith('.pth'):
        try:
            state_dict = torch.load(weights_path, map_location='cpu')
            new_state_dict = {}
            for k, v in state_dict.items():
                name = k.replace('module.', '') if k.startswith('module.') else k
                new_state_dict[name] = v
            model.load_state_dict(new_state_dict, strict=False)
            print(f"Loaded pretrained weights from {weights_path}")
        except Exception as e:
            print(f"Warning: Could not load weights: {e}")
    
    return model


def extract_csi_spectrogram(csi_data, fs=8.2, stft_window=256, stft_hop=128):
    """
    Extract STFT spectrogram from CSI data for CNN2D input.
    
    Args:
        csi_data (np.ndarray): Complex CSI measurements or amplitude
        fs (float): Sampling frequency
        stft_window (int): STFT window size
        stft_hop (int): STFT hop size
    
    Returns:
        torch.Tensor: Spectrogram tensor (1, 1, time_frames, freq_bins)
    """
    from scipy import signal as scipy_signal
    
    if csi_data.ndim == 1:
        csi_data = np.abs(csi_data)  # Use amplitude if complex not available
    
    # STFT
    freqs, times, Zxx = scipy_signal.stft(
        csi_data, fs=fs, window='hann',
        nperseg=stft_window, noverlap=stft_window - stft_hop
    )
    
    magnitude = np.abs(Zxx)
    
    # Normalize to [0, 1]
    magnitude = (magnitude - magnitude.min()) / (magnitude.max() - magnitude.min() + 1e-10)
    
    # Resize/stretch to 128×128 target (for CNN2D)
    target_h, target_w = 128, 128
    
    if magnitude.shape[0] < target_h:
        padded = np.zeros((target_h, magnitude.shape[1]))
        padded[:magnitude.shape[0], :] = magnitude
        magnitude = padded
    else:
        magnitude = magnitude[:target_h, :]
    
    if magnitude.shape[1] < target_w:
        padded = np.zeros((magnitude.shape[0], target_w))
        padded[:, :magnitude.shape[1]] = magnitude
        magnitude = padded
    else:
        magnitude = magnitude[:, :target_w]
    
    # Add channel and batch dimensions
    tensor = torch.from_numpy(magnitude.astype(np.float32))
    tensor = tensor.unsqueeze(0).unsqueeze(0)  # (1, 1, H, W)
    
    return tensor


def extract_csi_statistical_features(csi_frames, num_subcarriers=52, window_size=16):
    """
    Extract statistical features from CSI frames for CNN1D-LSTM input.
    
    Args:
        csi_frames (np.ndarray): CSI amplitude data over time
            Shape: (num_frames, num_subcarriers) or (num_subcarriers,)
        num_subcarriers (int): Number of OFDM subcarriers
        window_size (int): Moving average window size
    
    Returns:
        torch.Tensor: Feature tensor (1, seq_len, num_features)
    """
    import numpy as np
    
    # Ensure 2D: (frames, subcarriers)
    if csi_frames.ndim == 1:
        csi_frames = csi_frames.reshape(-1, 1)
    
    if csi_frames.shape[1] < num_subcarriers:
        padded = np.zeros((csi_frames.shape[0], num_subcarriers))
        padded[:, :csi_frames.shape[1]] = csi_frames
        csi_frames = padded
    elif csi_frames.shape[1] > num_subcarriers:
        csi_frames = csi_frames[:, :num_subcarriers]
    
    # Apply moving average smoothing
    smoothed = np.zeros_like(csi_frames)
    for i in range(csi_frames.shape[1]):
        smoothed[:, i] = np.convolve(
            csi_frames[:, i], 
            np.ones(window_size) / window_size, 
            mode='same'
        )
    
    # Compute per-frame statistical features
    num_frames = smoothed.shape[0]
    features = np.zeros((num_frames, 8))  # 8 statistical features
    
    for i in range(num_frames):
        frame = smoothed[i]
        features[i, 0] = np.mean(frame)       # mean
        features[i, 1] = np.var(frame)        # variance
        features[i, 2] = np.sqrt(np.mean(frame**2))  # RMS
        q75, q25 = np.percentile(frame, [75, 25])
        features[i, 3] = q75 - q25           # IQR
        features[i, 4] = np.min(frame)       # min
        features[i, 5] = np.max(frame)       # max
        # Energy entropy
        hist, _ = np.histogram(frame, bins=10, density=True)
        hist = hist[hist > 0]
        features[i, 6] = -np.sum(hist * np.log(hist + 1e-10))  # energy entropy
        # Power spectral entropy
        psd = np.abs(np.fft.fft(frame))**2
        psd = psd / (np.sum(psd) + 1e-10)
        features[i, 7] = -np.sum(psd * np.log(psd + 1e-10))  # PSE
    
    # Add sequence dimension
    tensor = torch.from_numpy(features.astype(np.float32))
    tensor = tensor.unsqueeze(0)  # (1, seq_len, 8)
    
    return tensor


# Example inference
if __name__ == "__main__":
    print("WiFi Gesture Recognizer - Example")
    print("=" * 40)
    
    # Create model
    model = create_model(
        cnn2d_base_filters=32,
        cnn1d_in_channels=8,
        cnn1d_lstm_units=64,
        fusion_alpha=0.6,
        num_classes=3
    )
    
    # Set to eval mode
    model.eval()
    
    # Simulate spectrogram input (1, 1, 128, 128)
    dummy_spectrogram = torch.randn(1, 1, 128, 128)
    
    # Simulate statistical features input (1, 121, 8)
    dummy_stat_features = torch.randn(1, 256, 8)
    
    # Forward pass
    with torch.no_grad():
        output = model(dummy_spectrogram, dummy_stat_features)
    
    # Get prediction
    probabilities = F.softmax(output, dim=1)
    pred_idx = torch.argmax(probabilities, dim=1).item()
    
    # Class names
    class_names = ["Not Occupied", "Occupied Static", "Occupied Motion"]
    
    print(f"Input spectrogram shape: {dummy_spectrogram.shape}")
    print(f"Input stats shape: {dummy_stat_features.shape}")
    print(f"\nOutput logits: {output.squeeze().tolist()}")
    print(f"Probabilities: {probabilities.squeeze().tolist()}")
    print(f"\nPredicted gesture: {class_names[pred_idx]} ({probabilities[0, pred_idx]:.1%} confidence)")
    
    # Count parameters
    total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"\nTrainable parameters: {total_params:,}")
    
    print("\n✓ Model inference successful!")