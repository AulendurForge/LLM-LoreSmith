"""
Configuration manager for LLM LoreSmith.
Handles loading, validation, and access to configuration settings.
"""

import os
import yaml
from typing import Dict, Any, Optional


class ConfigManager:
    """Manages configuration settings for the application."""

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the configuration manager.
        
        Args:
            config_path: Path to the configuration file. If None, uses default.
        """
        self.config: Dict[str, Any] = {}
        self.config_path = config_path or os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "config",
            "default_config.yaml"
        )
        self.load_config()
    
    def load_config(self) -> None:
        """Load configuration from YAML file."""
        try:
            with open(self.config_path, 'r') as config_file:
                self.config = yaml.safe_load(config_file)
        except Exception as e:
            print(f"Error loading configuration: {e}")
            # Load minimal default configuration
            self.config = {
                "app": {"name": "LLM LoreSmith", "version": "0.1.0"},
                "deployment": {"mode": "local", "debug": True},
            }
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a configuration value by key.
        
        Args:
            key: Dot-separated path to the configuration value
            default: Default value if key is not found
            
        Returns:
            The configuration value or default
        """
        keys = key.split('.')
        value = self.config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
                
        return value
    
    def is_local_mode(self) -> bool:
        """Check if the application is running in local mode."""
        return self.get('deployment.mode') == 'local'
    
    def is_debug_mode(self) -> bool:
        """Check if the application is running in debug mode."""
        return self.get('deployment.debug', False)
    
    def get_ui_colors(self) -> Dict[str, str]:
        """Get UI color scheme."""
        return self.get('ui.colors', {
            "primary": "#FFFEFB",
            "secondary": "#7B949C",
            "accent": "#5C798B",
            "dark": "#213C4E",
            "darker": "#182241"
        })
    
    def get_ui_fonts(self) -> Dict[str, str]:
        """Get UI fonts."""
        return self.get('ui.fonts', {
            "heading": "Oswald",
            "body": "Nunito Sans",
            "code": "Source Code Pro"
        })
    
    def is_mcp_enabled(self) -> bool:
        """Check if Model Context Protocol is enabled."""
        return self.get('model.mcp_enabled', True)


# Create a singleton instance
config = ConfigManager()
