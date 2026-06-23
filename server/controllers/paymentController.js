const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");

const hasActiveBookingConflict = async (booking) => {
  const conflict = await Booking.findOne({
    _id: { $ne: booking._id },
    vehicle: booking.vehicle,
    bookingStatus: { $in: ["Pending", "Confirmed"] },
    pickupDate: { $lt: booking.returnDate },
    returnDate: { $gt: booking.pickupDate },
  });

  return !!conflict;
};

const getPayableAmount = (booking) => {
  if (booking.paymentStatus === "Completed") return 0;
  if (booking.paymentStatus === "Partial") return booking.remainingAmount;
  return booking.totalAmount / 2;
};

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
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to pay this booking" });
    }

    if (booking.bookingStatus === "Cancelled" || booking.bookingStatus === "Completed") {
      return res.status(400).json({ message: `Cannot pay a ${booking.bookingStatus.toLowerCase()} booking` });
    }

    if (await hasActiveBookingConflict(booking)) {
      return res.status(409).json({ message: "This vehicle is already booked for the selected dates" });
    }

    const amount = getPayableAmount(booking);
    if (amount <= 0) {
      return res.status(400).json({ message: "No pending payment for this booking" });
    }

    const options = {
      amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_order_${bookingId}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res
        .status(500)
        .json({ message: "Some error occurred with Razorpay" });
    }

    // Create a pending payment record
    await Payment.create({
      booking: bookingId,
      user: req.user._id,
      owner: booking.owner,
      razorpayOrderId: order.id,
      amount: amount,
      status: "Created",
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
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } =
      req.body;

    const sign = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpaySignature === expectedSign) {
      // Payment is verified
      const payment = await Payment.findOne({ razorpayOrderId });
      if (!payment) {
        return res.status(404).json({ message: "Payment order not found" });
      }

      if (payment.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to verify this payment" });
      }

      if (payment.status === "Success") {
        return res.status(200).json({ message: "Payment already verified" });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (payment.booking.toString() !== booking._id.toString()) {
        return res.status(400).json({ message: "Payment order does not match booking" });
      }

      if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to pay this booking" });
      }

      if (booking.bookingStatus === "Cancelled" || booking.bookingStatus === "Completed") {
        return res.status(400).json({ message: `Cannot pay a ${booking.bookingStatus.toLowerCase()} booking` });
      }

      if (await hasActiveBookingConflict(booking)) {
        return res.status(409).json({ message: "This vehicle is already booked for the selected dates" });
      }

      const payableAmount = getPayableAmount(booking);
      if (Math.abs(payment.amount - payableAmount) > 0.01) {
        return res.status(400).json({ message: "Payment amount no longer matches booking balance" });
      }

      if (payment) {
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.razorpaySignature = razorpaySignature;
        payment.status = "Success";
        await payment.save();
      }

      // Update Booking Status
      if (booking) {
        booking.paidAmount += payment.amount;
        booking.remainingAmount = Math.max(booking.totalAmount - booking.paidAmount, 0);

        if (booking.remainingAmount <= 0) {
          booking.paymentStatus = "Completed";
        } else {
          booking.paymentStatus = "Partial";
        }

        booking.razorpayOrderId = razorpayOrderId;
        booking.razorpayPaymentId = razorpayPaymentId;

        // If advance payment is done then, confirm the booking
        if (booking.bookingStatus === "Pending") {
          booking.bookingStatus = "Confirmed";

          const ChatRoom = require("../models/ChatRoom");
          await ChatRoom.findOneAndUpdate(
            { userId: booking.user, vehicleId: booking.vehicle },
            {
              isBooked: true,
              bookingId: booking._id,
            },
          );
        }

        await booking.save();
      }

      return res.status(200).json({ message: "Payment verified successfully" });
    } else {
      // Invalid signature
      const payment = await Payment.findOne({ razorpayOrderId });
      if (payment) {
        payment.status = "Failed";
        await payment.save();
      }
      return res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};
