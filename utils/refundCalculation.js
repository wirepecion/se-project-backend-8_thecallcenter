
exports.refundCalculation = (CheckInDate, CheckOutDate, CancellationDate, paymentAmount) => { 
    console.log("CheckInDate: ", CheckInDate);
    console.log("CheckOutDate: ", CheckOutDate); 
    console.log("CancellationDate: ", CancellationDate);
    console.log("paymentAmount: ", paymentAmount);
    return paymentAmount;
}