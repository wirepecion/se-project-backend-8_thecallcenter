
exports.refundCalculation = (CheckInDate, CheckOutDate, CancellationDate, paymentAmount) => { 
    
    console.log("CheckInDate: ", CheckInDate);
    console.log("CheckOutDate: ", CheckOutDate); 
    console.log("CancellationDate: ", CancellationDate);
    console.log("paymentAmount: ", paymentAmount);

    const days = 24 * 60 * 60 * 1000
    let refundPercent

    if (CancellationDate < CheckInDate) { // cancel before check-in date
        
        if (CheckInDate - CancellationDate > 3 * days) { // more than 3 days before check-in date
            refundPercent = 0.90
        } else { // less than 3 days before check-in date
            refundPercent = 0.50
        }

    } else if (CancellationDate > CheckOutDate) { // cancel after check-out date
        
        refundPercent = 0.00

    } else { // cancel after check-in date but before check-out date
        
        if (CheckOutDate - CheckInDate === 1 * days) { // booked for 1 day
            refundPercent = 0.00
        } else if (CheckOutDate - CheckInDate === 2 * days) { // booked for 2 days
            
            if (CancellationDate - CheckInDate < 1 * days) { // stayed less than 1 day
                refundPercent = 0.25
            } else { // stayed equal or more than 1 day
                refundPercent = 0.00
            }

        } else if (CheckOutDate - CheckInDate === 3 * days) { // booked for 3 days
        
            if (CancellationDate - CheckInDate < 1 * days) { // stayed less than 1 day
                refundPercent = 0.365
            } else if (CancellationDate - CheckInDate < 2 * days) { // stayed equal or more than 1 day but less than 2 days
                refundPercent = 0.12
            } else { // stayed equal or more than 2 days
                refundPercent = 0.00
            }

        }
    }

    console.log("Refund percent =", refundPercent * 100, "%");
    return refundPercent * paymentAmount
}