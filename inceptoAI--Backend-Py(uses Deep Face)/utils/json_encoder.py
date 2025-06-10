import json
import numpy as np

class NumpyEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle NumPy types."""
    
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

# Create dumps and loads functions that use NumpyEncoder
def dumps(*args, **kwargs):
    """JSON dumps function that uses NumpyEncoder."""
    kwargs.setdefault('cls', NumpyEncoder)
    return json.dumps(*args, **kwargs)

def loads(*args, **kwargs):
    """JSON loads function."""
    return json.loads(*args, **kwargs)