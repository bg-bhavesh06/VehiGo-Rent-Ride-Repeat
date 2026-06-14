// Razorpay payment integration logic

// Dynamically load Razorpay SDK
export const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initiatePayment = async (booking, user, axios, showNotification, fetchBookings) => {
  try {
    const res = await loadRazorpay();
    if (!res) {
      showNotification('error', 'Razorpay SDK failed to load. Are you online?');
      return;
    }

    // Calculate amount to pay (50% advance if pending, remaining if partial)
    const amountToPay = booking.paymentStatus === 'Pending' ? booking.totalAmount / 2 : booking.remainingAmount;

    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    
    // 1. Create Order
    const { data: order } = await axios.post('/api/payments/create-order', {
      bookingId: booking._id,
      amount: amountToPay
    }, config);

    // 2. Open Razorpay Checkout
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'your_fallback_key',
      amount: order.amount,
      currency: order.currency,
      name: 'Vehigo',
      description: `Payment for ${booking.vehicle?.name}`,
      order_id: order.id,
      handler: async function (response) {
        try {
          // 3. Verify Payment
          await axios.post('/api/payments/verify', {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            bookingId: booking._id
          }, config);
          
          showNotification('success', 'Payment Successful!');
          fetchBookings();
        } catch (err) {
          showNotification('error', 'Payment Verification Failed');
        }
      },
      prefill: {
        name: user.name,
        email: user.email,
      },
      theme: { color: '#2563eb' }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();

  } catch (error) {
    console.error(error);
    showNotification('error', 'Error initiating payment');
  }
};
