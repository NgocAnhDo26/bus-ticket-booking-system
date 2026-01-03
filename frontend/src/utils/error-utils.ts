export const getFriendlyErrorMessage = (error: unknown): string => {
  let message = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';

  if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    // Check axios response.data.message FIRST (backend API error message)
    if ('response' in error && (error as { response: { data: unknown } }).response?.data) {
      const data = (error as { response: { data: unknown } }).response.data;
      if (typeof data === 'string') {
        message = data;
      } else if (data && typeof data === 'object' && 'message' in data) {
        message = (data as { message: string }).message;
      }
    }
    // Fallback to error.message (axios generic error like "Request failed with status code 401")
    else if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      message = (error as { message: string }).message;
    }
  }

  // Map common backend errors to Vietnamese
  const lowerMsg = message.toLowerCase();

  // Authentication errors
  if (lowerMsg.includes('bad credentials') || lowerMsg.includes('user not found')) {
    return 'Email hoặc mật khẩu không chính xác.';
  }
  if (lowerMsg.includes('email already registered') || lowerMsg.includes('email already in use')) {
    return 'Email này đã được sử dụng. Vui lòng chọn email khác.';
  }
  if (lowerMsg.includes('phone number already in use')) {
    return 'Số điện thoại này đã được sử dụng.';
  }
  if (lowerMsg.includes('account not activated')) {
    return 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email.';
  }
  if (
    lowerMsg.includes('invalid activation token') ||
    lowerMsg.includes('activation token expired')
  ) {
    return 'Mã kích hoạt không hợp lệ hoặc đã hết hạn. Vui lòng đăng ký lại.';
  }
  if (lowerMsg.includes('token expired') || lowerMsg.includes('refresh token expired')) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }
  if (
    lowerMsg.includes('old password is incorrect') ||
    (lowerMsg.includes('password') && lowerMsg.includes('incorrect'))
  ) {
    return 'Mật khẩu cũ không chính xác.';
  }
  if (lowerMsg.includes('new password must be different')) {
    return 'Mật khẩu mới phải khác mật khẩu cũ.';
  }
  if (lowerMsg.includes('password cannot be changed for oauth')) {
    return 'Không thể đổi mật khẩu cho tài khoản đăng nhập bằng Google.';
  }
  if (
    lowerMsg.includes('google sign-in failed') ||
    lowerMsg.includes('invalid google credential')
  ) {
    return 'Đăng nhập Google thất bại. Vui lòng thử lại.';
  }
  if (lowerMsg.includes('user not authenticated')) {
    return 'Vui lòng đăng nhập để tiếp tục.';
  }

  // Booking errors
  if (lowerMsg.includes('booking not found') || lowerMsg.includes('email does not match')) {
    return 'Không tìm thấy đặt vé hoặc email không khớp.';
  }
  if (lowerMsg.includes('only pending bookings can be confirmed')) {
    return 'Chỉ có thể xác nhận đặt vé đang chờ thanh toán.';
  }
  if (lowerMsg.includes('booking is already cancelled')) {
    return 'Đặt vé này đã bị hủy trước đó.';
  }
  if (lowerMsg.includes('cannot cancel booking for departed trip')) {
    return 'Không thể hủy vé cho chuyến xe đã khởi hành.';
  }
  if (lowerMsg.includes('booking is already refunded')) {
    return 'Đặt vé này đã được hoàn tiền trước đó.';
  }
  if (lowerMsg.includes('cannot refund a pending booking')) {
    return 'Không thể hoàn tiền cho đặt vé đang chờ thanh toán.';
  }
  if (lowerMsg.includes('only pending bookings can be updated')) {
    return 'Chỉ có thể cập nhật đặt vé đang chờ thanh toán.';
  }
  if (lowerMsg.includes('seats are already booked')) {
    return 'Một hoặc nhiều ghế đã được đặt bởi người khác.';
  }
  if (lowerMsg.includes('invalid pickup station')) {
    return 'Điểm đón không hợp lệ cho chuyến này.';
  }
  if (lowerMsg.includes('invalid dropoff station')) {
    return 'Điểm trả không hợp lệ cho chuyến này.';
  }
  if (lowerMsg.includes('pickup station must be before dropoff')) {
    return 'Điểm đón phải trước điểm trả.';
  }
  if (lowerMsg.includes('failed to generate unique booking code')) {
    return 'Lỗi tạo mã đặt vé. Vui lòng thử lại.';
  }
  if (lowerMsg.includes('already_checked_in') || lowerMsg.includes('đã được check-in')) {
    return 'Vé này đã được check-in trước đó.';
  }
  if (lowerMsg.includes('ticket not found')) {
    return 'Không tìm thấy vé.';
  }

  // Admin errors
  if (lowerMsg.includes('can only update admin users via this endpoint')) {
    return 'Chỉ có thể cập nhật tài khoản admin qua đây.';
  }

  // Network errors
  if (lowerMsg.includes('network error') || lowerMsg.includes('err_network')) {
    return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.';
  }
  if (lowerMsg.includes('timeout')) {
    return 'Yêu cầu quá thời gian. Vui lòng thử lại.';
  }

  // If message is already likely a readable sentence (from our backend manual messages), use it.
  // Otherwise, return default.
  return message;
};
