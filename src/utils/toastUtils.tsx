import toast, { ToastOptions } from 'react-hot-toast';

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#1f2937',
    color: '#ffffff',
    border: '1px solid #374151',
  },
};

export const showSuccess = (message: string, options?: ToastOptions) =>
  toast.success(message, {
    ...defaultOptions,
    style: {
      ...defaultOptions.style,
      background: '#065f46',
      border: '1px solid #047857',
    },
    ...options,
  });

export const showError = (message: string, options?: ToastOptions) =>
  toast.error(message, {
    ...defaultOptions,
    style: {
      ...defaultOptions.style,
      background: '#991b1b',
      border: '1px solid #dc2626',
    },
    ...options,
  });

export const showWarning = (message: string, options?: ToastOptions) =>
  toast(message, {
    ...defaultOptions,
    style: {
      ...defaultOptions.style,
      background: '#92400e',
      border: '1px solid #d97706',
    },
    icon: '⚠️',
    ...options,
  });

export const showInfo = (message: string, options?: ToastOptions) =>
  toast(message, {
    ...defaultOptions,
    style: {
      ...defaultOptions.style,
      background: '#1e40af',
      border: '1px solid #3b82f6',
    },
    icon: 'ℹ️',
    ...options,
  });

export const showLoading = (message: string, options?: ToastOptions) =>
  toast.loading(message, {
    ...defaultOptions,
    style: {
      ...defaultOptions.style,
      background: '#374151',
      border: '1px solid #6b7280',
    },
    ...options,
  });

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

export const dismissAllToasts = () => {
  toast.dismiss();
};

export function showPromise<T>(
  promise: Promise<T>,
  {
    loading = 'Loading...',
    success = 'Success!',
    error = 'An error occurred',
  }: {
    loading?: string;
    success?: string;
    error?: string;
  } = {}
): Promise<T> {
  const toastId = showLoading(loading);
  return promise
    .then((result) => {
      toast.success(success, { id: toastId });
      return result;
    })
    .catch((err) => {
      toast.error(error, { id: toastId });
      throw err;
    });
}

export const showConfirmation = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  toast(
    (t) => (
      <div className="flex flex-col space-y-3">
        <span className="text-sm">{message}</span>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm();
            }}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              if (onCancel) onCancel();
            }}
            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ),
    {
      ...defaultOptions,
      duration: 10000,
      style: {
        ...defaultOptions.style,
        background: '#1f2937',
        border: '1px solid #374151',
        minWidth: '300px',
      },
    }
  );
};

export const showInput = (
  message: string,
  placeholder: string = '',
  onConfirm: (value: string) => void,
  onCancel?: () => void
) => {
  let inputValue = '';
  toast(
    (t) => (
      <div className="flex flex-col space-y-3">
        <span className="text-sm">{message}</span>
        <input
          type="text"
          placeholder={placeholder}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          onChange={(e) => {
            inputValue = e.target.value;
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              toast.dismiss(t.id);
              onConfirm(inputValue);
            }
          }}
          autoFocus
        />
        <div className="flex space-x-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm(inputValue);
            }}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onCancel?.();
            }}
            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ),
    {
      ...defaultOptions,
      duration: 15000,
      style: {
        ...defaultOptions.style,
        background: '#1f2937',
        border: '1px solid #374151',
        minWidth: '350px',
      },
    }
  );
};

export const showAlert = (message: string) => showInfo(message);

export const showConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    showConfirmation(
      message,
      () => resolve(true),
      () => resolve(false)
    );
  });
};

export const showPrompt = (message: string, defaultValue: string = ''): Promise<string | null> => {
  return new Promise((resolve) => {
    showInput(
      message,
      defaultValue,
      (value) => resolve(value),
      () => resolve(null)
    );
  });
}; 