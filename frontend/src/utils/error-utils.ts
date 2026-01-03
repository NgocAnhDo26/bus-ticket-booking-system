export const getFriendlyErrorMessage = (error: unknown): string => {
  let message = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';

  if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      message = (error as { message: string }).message;
    } else if ('response' in error && (error as { response: { data: unknown } }).response?.data) {
      const data = (error as { response: { data: unknown } }).response.data;
      if (typeof data === 'string') {
        message = data;
      } else if (data && typeof data === 'object' && 'message' in data) {
        message = (data as { message: string }).message;
      }
    }
  }

  // Map common backend errors to Vietnamese
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('bad credentials') || lowerMsg.includes('user not found')) {
    return 'Email hoặc mật khẩu không chính xác.';
  }
  if (lowerMsg.includes('email already registered') || lowerMsg.includes('email already in use')) {
    return 'Email này đã được sử dụng. Vui lòng chọn email khác.';
  }
  if (lowerMsg.includes('account not activated')) {
    return 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email.';
  }
  if (lowerMsg.includes('invalid activation token')) {
    return 'Mã kích hoạt không hợp lệ hoặc đã hết hạn. Vui lòng đăng ký lại.';
  }
  if (lowerMsg.includes('token expired')) {
    return 'Mã kích hoạt đã hết hạn. Vui lòng đăng ký lại.';
  }
  if (lowerMsg.includes('password') && lowerMsg.includes('incorrect')) {
    return 'Mật khẩu cũ không chính xác.';
  }
  if (lowerMsg.includes('google sign-in failed')) {
    return 'Đăng nhập Google thất bại. Vui lòng thử lại.';
  }

  // If message is already likely a readable sentence (from our backend manual messages), use it.
  // Otherwise, return default.
  // Ideally, backend should return code, but we work with strings for now.
  return message;
};
