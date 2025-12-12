# Adding New Functions

This guide explains how to add new functions that work with both the MCP server and A2A CLI.

## Overview

Functions in this project are shared between the MCP server and A2A CLI. Each function:
- Inherits from `BaseFunction`
- Implements `execute()` and `get_schema()` methods
- Is registered in the global function registry
- Can be async or sync (automatically handled)

## Step-by-Step Guide

### 1. Create Your Function File

Create a new file in `src/shared/functions/` for your function:

```python
# src/shared/functions/my_function.py
from typing import Any, Dict
from src.shared.base_functions import BaseFunction


class MyFunction(BaseFunction):
    def __init__(self):
        super().__init__(
            name="my_function_name",
            description="Brief description of what this function does"
        )
    
    async def execute(self, param1: str, param2: int = 10) -> Dict[str, Any]:
        """
        Execute the function logic.
        
        Args:
            param1: Description of param1
            param2: Description of param2 (optional)
        
        Returns:
            Dictionary with function results
        """
        # Your function logic here
        result = {
            "status": "success",
            "data": f"Processed {param1} with value {param2}"
        }
        return result
    
    def get_schema(self) -> Dict[str, Any]:
        """Define the JSON schema for function parameters."""
        return {
            "type": "object",
            "properties": {
                "param1": {
                    "type": "string",
                    "description": "Description of param1"
                },
                "param2": {
                    "type": "integer",
                    "description": "Description of param2",
                    "default": 10
                }
            },
            "required": ["param1"]
        }
```

### 2. Register Your Function

Add your function to the registry in `src/shared/functions/__init__.py`:

```python
from .my_function import MyFunction

def initialize_functions():
    """Initialize and register all available functions."""
    # Existing registrations...
    function_registry.register(KubeconfigFunction())
    
    # Add your new function
    function_registry.register(MyFunction())
```

### 3. Test Your Function

Create a test file in `tests/`:

```python
# tests/test_my_function.py
import pytest
from src.shared.functions.my_function import MyFunction


@pytest.mark.asyncio
async def test_my_function():
    func = MyFunction()
    
    # Test basic execution
    result = await func.execute(param1="test", param2=20)
    assert result["status"] == "success"
    assert "test" in result["data"]
    
    # Test with default parameter
    result = await func.execute(param1="test")
    assert result["status"] == "success"
    
    # Test schema
    schema = func.get_schema()
    assert "param1" in schema["properties"]
    assert "param1" in schema["required"]
```

### 4. Use Your Function

#### With A2A CLI:
```bash
# List to see your function
a2a list-functions

# Execute your function
a2a execute my_function_name --param param1=hello --param param2=42
```

#### With MCP Server:
Your function will automatically be available to Claude Desktop and other MCP clients.

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```python
async def execute(self, **kwargs) -> Dict[str, Any]:
    try:
        # Your logic
        return {"status": "success", "data": result}
    except FileNotFoundError as e:
        return {"status": "error", "error": f"File not found: {str(e)}"}
    except Exception as e:
        return {"status": "error", "error": f"Unexpected error: {str(e)}"}
```

### 2. Input Validation

Validate inputs in your execute method:

```python
async def execute(self, file_path: str, **kwargs) -> Dict[str, Any]:
    if not os.path.exists(file_path):
        return {"status": "error", "error": f"File not found: {file_path}"}
    
    # Continue with logic...
```

### 3. Async vs Sync

- Use `async def execute()` for I/O operations or when calling other async functions
- The framework automatically handles async/sync conversion for CLI usage
- Example of sync function:

```python
def execute(self, text: str) -> Dict[str, Any]:
    # Synchronous processing
    return {"reversed": text[::-1]}
```

### 4. Rich Return Types

Structure your returns for clarity:

```python
return {
    "status": "success",
    "data": {
        "processed_items": 10,
        "results": [...],
        "metadata": {
            "processing_time": 1.23,
            "timestamp": datetime.now().isoformat()
        }
    }
}
```

### 5. Schema Best Practices

- Always include descriptions for parameters
- Use appropriate types (string, integer, boolean, array, object)
- Mark required parameters explicitly
- Provide defaults where sensible

```python
def get_schema(self) -> Dict[str, Any]:
    return {
        "type": "object",
        "properties": {
            "input_file": {
                "type": "string",
                "description": "Path to input file"
            },
            "format": {
                "type": "string",
                "enum": ["json", "yaml", "csv"],
                "default": "json",
                "description": "Output format"
            },
            "filters": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of filters to apply"
            }
        },
        "required": ["input_file"]
    }
```

## Example: Complete Function

Here's a complete example of a function that lists files in a directory:

```python
# src/shared/functions/list_files.py
import os
from pathlib import Path
from typing import Any, Dict, List
from src.shared.base_functions import BaseFunction


class ListFilesFunction(BaseFunction):
    """Function to list files in a directory with filtering options."""
    
    def __init__(self):
        super().__init__(
            name="list_files",
            description="List files in a directory with optional filtering"
        )
    
    async def execute(
        self, 
        directory: str = ".",
        pattern: str = "*",
        recursive: bool = False,
        include_hidden: bool = False
    ) -> Dict[str, Any]:
        """List files in a directory."""
        try:
            path = Path(directory)
            if not path.exists():
                return {
                    "status": "error",
                    "error": f"Directory not found: {directory}"
                }
            
            if not path.is_dir():
                return {
                    "status": "error",
                    "error": f"Not a directory: {directory}"
                }
            
            files: List[str] = []
            
            if recursive:
                for file_path in path.rglob(pattern):
                    if file_path.is_file():
                        if include_hidden or not file_path.name.startswith('.'):
                            files.append(str(file_path.relative_to(path)))
            else:
                for file_path in path.glob(pattern):
                    if file_path.is_file():
                        if include_hidden or not file_path.name.startswith('.'):
                            files.append(file_path.name)
            
            return {
                "status": "success",
                "directory": str(path.absolute()),
                "pattern": pattern,
                "file_count": len(files),
                "files": sorted(files)
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": f"Failed to list files: {str(e)}"
            }
    
    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "directory": {
                    "type": "string",
                    "description": "Directory to list files from",
                    "default": "."
                },
                "pattern": {
                    "type": "string",
                    "description": "Glob pattern for filtering files",
                    "default": "*"
                },
                "recursive": {
                    "type": "boolean",
                    "description": "Search recursively in subdirectories",
                    "default": False
                },
                "include_hidden": {
                    "type": "boolean",
                    "description": "Include hidden files (starting with .)",
                    "default": False
                }
            },
            "required": []
        }
```

Don't forget to register it in `src/shared/functions/__init__.py`:

```python
from .list_files import ListFilesFunction

def initialize_functions():
    # ... existing registrations
    function_registry.register(ListFilesFunction())
```

## Testing Your Function

Run the function locally before committing:

```bash
# Test with CLI
a2a execute list_files --param directory=/tmp --param recursive=true

# Run unit tests
uv run pytest tests/test_list_files.py -v
```

That's it! Your function is now available in both the MCP server and A2A CLI.