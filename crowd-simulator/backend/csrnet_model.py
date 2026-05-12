"""
CSRNet model definition — matches the architecture from your training notebook.
VGG-16 frontend (first 23 layers) + dilated convolution backend.
"""
import torch
import torch.nn as nn
from torchvision import models


class CSRNet(nn.Module):
    def __init__(self):
        super().__init__()
        vgg = models.vgg16(weights=None)  # We load custom weights, not ImageNet
        self.frontend = nn.Sequential(*list(vgg.features.children())[:23])
        self.backend = nn.Sequential(
            nn.Conv2d(512, 512, 3, padding=2, dilation=2), nn.ReLU(True),
            nn.Conv2d(512, 512, 3, padding=2, dilation=2), nn.ReLU(True),
            nn.Conv2d(512, 512, 3, padding=2, dilation=2), nn.ReLU(True),
            nn.Conv2d(512, 256, 3, padding=2, dilation=2), nn.ReLU(True),
            nn.Conv2d(256, 128, 3, padding=2, dilation=2), nn.ReLU(True),
            nn.Conv2d(128, 64, 3, padding=2, dilation=2), nn.ReLU(True),
        )
        self.output_layer = nn.Conv2d(64, 1, 1)

    def forward(self, x):
        x = self.frontend(x)
        x = self.backend(x)
        x = self.output_layer(x)
        return x
