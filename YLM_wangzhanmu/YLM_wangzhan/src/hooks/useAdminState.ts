import { useState } from 'react';

export default function useAdminState() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetState = () => {
    setLoading(false);
    setError(null);
    setSuccess(null);
  };

  const setLoadingState = (isLoading: boolean) => {
    setLoading(isLoading);
    if (!isLoading) {
      setError(null);
    }
  };

  const setErrorState = (errorMessage: string) => {
    setError(errorMessage);
    setLoading(false);
    setSuccess(null);
  };

  const setSuccessState = (successMessage: string) => {
    setSuccess(successMessage);
    setLoading(false);
    setError(null);
  };

  return {
    loading,
    error,
    success,
    resetState,
    setLoadingState,
    setErrorState,
    setSuccessState,
  };
}
