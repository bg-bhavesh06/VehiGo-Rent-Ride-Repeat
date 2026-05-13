const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay Order (For Advance Payment)
// @route   POST /api/payments/create-order
// @access  Private/User
const createOrder = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const options = {
      amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_order_${bookingId}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ message: 'Some error occurred with Razorpay' });
    }

    // Create a pending payment record
    await Payment.create({
      booking: bookingId,
      user: req.user._id,
      owner: booking.owner,
      razorpayOrderId: order.id,
      amount: amount,
      status: 'Created',
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payments/verify
// @access  Private/User
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      bookingId,
    } = req.body;

    const sign = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpaySignature === expectedSign) {
      // Payment is verified
      const payment = await Payment.findOne({ razorpayOrderId });
      if (payment) {
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.razorpaySignature = razorpaySignature;
        payment.status = 'Success';
        await payment.save();
      }

      // Update Booking Status
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.paidAmount += payment.amount;
        booking.remainingAmount = booking.totalAmount - booking.paidAmount;
        
        if (booking.remainingAmount <= 0) {
          booking.paymentStatus = 'Completed';
        } else {
          booking.paymentStatus = 'Partial';
        }
        
        booking.razorpayOrderId = razorpayOrderId;
        booking.razorpayPaymentId = razorpayPaymentId;
        
        // If advance payment is done, confirm the booking
        if (booking.bookingStatus === 'Pending') {
           booking.bookingStatus = 'Confirmed';
        }

        await booking.save();
      }

      return res.status(200).json({ message: 'Payment verified successfully' });
    } else {
      // Invalid signature
      const payment = await Payment.findOne({ razorpayOrderId });
      if (payment) {
        payment.status = 'Failed';
        await payment.save();
      }
      return res.status(400).json({ message: 'Invalid signature sent!' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};
