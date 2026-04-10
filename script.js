var cart = [];
var exchangeRate = 0;
var RAZORPAY_KEY_ID = "rzp_live_SXP13njJD5Ks9k";
// UPDATED: New Clean URL to fix Insecure Content / Strict Browsing block
var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzDLX82l5S7sRiYUQVZjCgAdDTaBIYQ_yjvRGpdelQDMLhWVRa4gGrVyaZ1JH7eSm2ckQ/exec";
var whatsappNumber = "919892223162";

var cartDiv = document.getElementById('cart');
var priceBreakupDiv = document.getElementById('priceBreakup');
var nameEl = document.getElementById('name');
var emailEl = document.getElementById('email');
var mobileEl = document.getElementById('mobile');
var dobEl = document.getElementById('dob');
var queryEl = document.getElementById('query');
var dateEl = document.getElementById('date');
var timeEl = document.getElementById('time');
var locationEl = document.getElementById('location');
var agreeEl = document.getElementById('agree');
var payBtn = document.getElementById('payBtn');
var note = document.getElementById('note');

function toggleMusic() {
    var audio = document.getElementById('bgMusic');
    var btn = document.getElementById('musicBtn');
    if (audio.paused) { audio.play(); btn.innerHTML = "&#128266;"; btn.classList.add('playing'); }
    else { audio.pause(); btn.innerHTML = "&#127925;"; btn.classList.remove('playing'); }
}

function reveal() {
    var reveals = document.querySelectorAll(".reveal");
    for (var i = 0; i < reveals.length; i++) {
        if (reveals[i].getBoundingClientRect().top < window.innerHeight - 150) reveals[i].classList.add("active");
    }
}
window.addEventListener("scroll", reveal);
reveal();
window.onscroll = function() { scrollFunction(); reveal(); };

function scrollFunction() {
    document.getElementById("topBtn").style.display = (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) ? "block" : "none";
}
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

var accBtns = document.getElementsByClassName("accordion-btn");
for (var i = 0; i < accBtns.length; i++) {
    accBtns[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        panel.style.display = panel.style.display === "block" ? "none" : "block";
    });
}

async function fetchExchangeRate() {
    try { var response = await fetch('https://open.er-api.com/v6/latest/INR'); var data = await response.json(); exchangeRate = data.rates.USD; }
    catch (error) { exchangeRate = 1 / 83; }
    render(); toggleSections(); checkPay();
}

function getISTDate(dateStr, timeStr) {
    var parts = timeStr.split(' ');
    var time = parts[0];
    var modifier = parts[1];
    var hours = parseInt(time);
    if (hours === 12) hours = modifier === 'AM' ? 0 : 12;
    else if (modifier === 'PM') hours += 12;
    return new Date(dateStr + 'T' + String(hours).padStart(2, '0') + ':00:00+05:30');
}

function addToCart(name, price, format) {
    var label = name + " (" + format + ")";
    if (!cart.find(function(i) { return i.name === label; })) cart.push({ name: label, price: price });
    render(); toggleSections(); checkPay();
    
    // FIX: Auto-scroll to booking section when item is added
    var bookingSection = document.getElementById('booking');
    if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function removeItem(name) { cart = cart.filter(function(i) { return i.name !== name; }); render(); toggleSections(); checkPay(); }

function render() {
    var subINR = 0;
    var html = "";
    var loc = locationEl.value;
    cart.forEach(function(i) {
        subINR += i.price;
        var displayPrice = (loc === 'domestic') ? '\u20B9' + i.price : '$' + (i.price * exchangeRate).toFixed(2);
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="item-name">' + i.name + '</span><span class="item-price">' + displayPrice + '</span><button class="btn" style="padding:6px 10px;font-size:12px;background:#ef4444" onclick="removeItem(\'' + i.name.replace(/'/g, "\\'") + '\')">Remove</button></div>';
    });
    var pdfItems = cart.filter(function(i) { return i.name.includes('PDF') || i.name.includes('Monthly') || i.name.includes('Quarterly') || i.name.includes('Half-Yearly') || i.name.includes('Yearly') || i.name.includes('Chakra'); });
    var discountINR = pdfItems.length === 2 ? pdfItems.reduce(function(a, b) { return a + b.price; }, 0) * 0.1 : pdfItems.length >= 3 ? pdfItems.reduce(function(a, b) { return a + b.price; }, 0) * 0.15 : 0;
    var finalINR = subINR - discountINR;
    var finalUSD = finalINR * exchangeRate;
    var priceHTML = "";
    if (cart.length > 0) {
        if (discountINR > 0) priceHTML += '<p class="discount-text">Discount Applied - ' + (loc === 'domestic' ? '\u20B9' + Math.round(discountINR) : '$' + (discountINR * exchangeRate).toFixed(2)) + '</p>';
        priceHTML += '<div class="total-text">Total: ' + (loc === 'domestic' ? '\u20B9' + Math.round(finalINR) : '$' + finalUSD.toFixed(2)) + '</div>';
        if (loc === 'international') priceHTML += '<div class="rate-text">Live Rate: 1 INR = ' + exchangeRate.toFixed(4) + ' USD</div>';
    }
    cartDiv.innerHTML = html || "No items added yet.";
    priceBreakupDiv.innerHTML = priceHTML;
    window.finalINR = Math.round(finalINR);
    window.finalUSD = finalUSD.toFixed(2);
}

locationEl.addEventListener('change', function() {
    document.getElementById('usdNote').style.display = locationEl.value === 'international' ? 'block' : 'none';
});

function toggleSections() {
    var hasPDF = cart.some(function(i) { return i.name.includes('PDF') || i.name.includes('Monthly') || i.name.includes('Quarterly') || i.name.includes('Half-Yearly') || i.name.includes('Yearly') || i.name.includes('Chakra'); });
    var hasLive = cart.some(function(i) { return i.name.includes('Live'); });
    document.getElementById('pdfSection').style.display = hasPDF ? 'block' : 'none';
    document.getElementById('liveSection').style.display = hasLive ? 'block' : 'none';
}

// --- UPDATED FUNCTION WITH BUG FIX ---
function updateSlots() {
    if (!dateEl.value) { 
        timeEl.innerHTML = '<option value="">Select date first</option>'; 
        return; 
    }
    
    timeEl.innerHTML = '<option value="">Checking availability...</option>';
    
    var callbackName = 'jsonpCallback_' + Date.now();
    var script = document.createElement('script');
    
    // 1. Set a timeout. If the server doesn't reply in 8 seconds, show error.
    var timeoutId = setTimeout(function() {
        // Only show error if we are still waiting
        if (timeEl.innerHTML.includes('Checking availability')) {
            timeEl.innerHTML = '<option value="">Connection timeout. Try selecting date again.</option>';
        }
        delete window[callbackName];
    }, 8000);

    // 2. Define the callback
    window[callbackName] = function(data) {
        clearTimeout(timeoutId);
        
        try {
            // Check if data is valid
            if (!data || !data.slots) {
                 throw new Error("Invalid data");
            }

            timeEl.innerHTML = '';
            
            if (data.slots.length === 0) { 
                timeEl.innerHTML = '<option value="">No slots available</option>'; 
            } else {
                data.slots.forEach(function(s) {
                    var istDate = getISTDate(dateEl.value, s);
                    var userTimeStr = istDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                    var opt = document.createElement('option');
                    opt.value = s;
                    opt.textContent = userTimeStr + ' (Your Time) / ' + s + ' (India)';
                    timeEl.appendChild(opt);
                });
            }
        } catch (error) {
            console.error("Slot Error:", error);
            timeEl.innerHTML = '<option value="">Error loading slots. Please try again.</option>';
        }
        
        checkPay();
    };

    // 3. We REMOVED the script.onerror handler because it was too aggressive.
    // Now we rely on the timeout above.

    script.src = SCRIPT_URL + '?action=getSlots&date=' + dateEl.value + '&callback=' + callbackName;
    document.body.appendChild(script);
}
// -------------------------------------

dateEl.addEventListener('change', updateSlots);

function checkPay() {
    var hasPDF = cart.some(function(i) { return i.name.includes('PDF') || i.name.includes('Monthly') || i.name.includes('Quarterly') || i.name.includes('Half-Yearly') || i.name.includes('Yearly') || i.name.includes('Chakra'); });
    var hasLive = cart.some(function(i) { return i.name.includes('Live'); });
    payBtn.disabled = true;
    payBtn.style.opacity = 0.5;
    if (cart.length === 0) { note.innerText = "Please select a service"; return; }
    if (!agreeEl.checked) { note.innerText = "Please accept booking conditions"; return; }
    if (!nameEl.value || !emailEl.value || !mobileEl.value) { note.innerText = "Please fill Name, Email and Mobile"; return; }
    if (hasPDF && (!dobEl.value || !queryEl.value)) { note.innerText = "Please fill DOB and Query for PDF reading"; return; }
    if (hasLive && !dateEl.value) { note.innerText = "Please select a date"; return; }
    if (hasLive && !timeEl.value) { note.innerText = "Please select a time slot"; return; }
    note.innerText = "";
    payBtn.disabled = false;
    payBtn.style.opacity = 1;
}

[nameEl, emailEl, mobileEl, dobEl, queryEl].forEach(function(el) { if (el) el.addEventListener('input', checkPay); });
if (timeEl) timeEl.addEventListener('change', checkPay);
if (agreeEl) agreeEl.addEventListener('change', checkPay);

function generateBookingId() { return 'TTT-' + Date.now().toString().slice(-6); }

function bookCalendarSlot(bookingId, services, date, time) {
    var callbackName = 'bookCallback_' + Date.now();
    window[callbackName] = function(data) { delete window[callbackName]; document.body.removeChild(script); };
    var script = document.createElement('script');
    script.src = SCRIPT_URL + '?action=bookSlot&bookingId=' + bookingId + '&name=' + encodeURIComponent(nameEl.value) + '&service=' + encodeURIComponent(services) + '&date=' + date + '&time=' + time + '&callback=' + callbackName;
    document.body.appendChild(script);
}

payBtn.onclick = function() {
    if (!window.finalINR || window.finalUSD <= 0) return alert("Error calculating amount.");
    if (RAZORPAY_KEY_ID === "YOUR_KEY_ID_HERE") return alert("Razorpay Key ID not set.");
    var services = cart.map(function(i) { return i.name; }).join(', ');
    var bookingDate = dateEl.value;
    var bookingTime = timeEl.value;
    var custName = nameEl.value;
    var custEmail = emailEl.value;
    var custMobile = mobileEl.value;
    var custDob = dobEl.value;
    var custQuery = queryEl.value;
    var isInternational = locationEl.value === 'international';
    var currency = isInternational ? "USD" : "INR";
    var amount = isInternational ? Math.round(window.finalUSD * 100) : window.finalINR * 100;
    var symbol = isInternational ? '$' : '\u20B9';
    var displayAmount = isInternational ? window.finalUSD : window.finalINR;
    var options = {
        key: RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: "Tarot Tells Tales",
        description: services,
        image: "https://tarottellstales.co.in/logo.png",
        handler: function(response) {
            var bookingId = generateBookingId();
            if (bookingDate && bookingTime) { bookCalendarSlot(bookingId, services, bookingDate, bookingTime); }
            sendWhatsAppConfirmation(bookingId, response.razorpay_payment_id, services, symbol, displayAmount, isInternational, custName, custEmail, custMobile, custDob, custQuery, bookingDate, bookingTime);
            showSuccessModal(bookingId, response.razorpay_payment_id, symbol + displayAmount, isInternational ? 'International (USD)' : 'Domestic (INR)');
        },
        prefill: { name: custName, email: custEmail, contact: custMobile },
        notes: { services: services },
        theme: { color: "#7c3aed" }
    };
    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function(response) { showErrorModal(response.error.description); });
    rzp.open();
};

function sendWhatsAppConfirmation(bookingId, paymentId, services, symbol, amount, isInternational, custName, custEmail, custMobile, custDob, custQuery, bookingDate, bookingTime) {
    var locationLabel = isInternational ? '\uD83C\uDF0D International (USD)' : '\uD83C\uDDEE\uD83C\uDDF3 Domestic (INR)';
    var timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
    var msg = '\u2705 *PAYMENT CONFIRMED*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u{1F4CB} *Booking ID:* ' + bookingId + '\n\u{1F4B3} *Payment ID:* ' + paymentId + '\n\u{1F4C1} *Type:* ' + locationLabel + '\n\u{1F550} *Paid at:* ' + timestamp + ' (IST)\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u{1F464} *Name:* ' + custName + '\n\u{1F4E7} *Email:* ' + custEmail + '\n\u{1F4F1} *Mobile:* ' + custMobile + '\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u{1F4E6} *Services:*\n' + services + '\n\u{1F4B0} *Amount Paid:* ' + symbol + amount + '\n';
    if (custDob) msg += '\u{1F382} *DOB:* ' + custDob + '\n';
    if (custQuery) msg += '\u2753 *Query:* ' + custQuery + '\n';
    if (bookingDate && bookingTime) { msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u{1F4C5} *Date:* ' + bookingDate + '\n\u{1F550} *Time:* ' + bookingTime + ' (IST)\n'; }
    window.open("https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(msg), '_blank');
}

function showSuccessModal(bookingId, paymentId, amountStr, locationType) {
    var existing = document.getElementById('successModal'); if (existing) existing.remove();
    var modal = document.createElement('div'); modal.id = 'successModal';
    modal.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;"><div class="modal-card" style="background:#1a0f2a;border-radius:18px;padding:30px;max-width:420px;width:100%;text-align:center;border:1px solid #22c55e;"><div style="font-size:60px;margin-bottom:10px;">&#127881;</div><h3 style="color:#22c55e;margin:0 0 12px 0;font-size:22px;">Payment Successful!</h3><p style="color:#cbd5f5;line-height:1.7;font-size:14px;margin:0 0 20px 0;">Your booking <strong style="color:#a5f3fc;">' + bookingId + '</strong> is confirmed.<br><br>A WhatsApp message has been opened. Please <strong style="color:#fcd34d;">send that message</strong> to complete your booking.</p><div style="background:#2b1b4e;border-radius:10px;padding:12px;margin-bottom:10px;"><span style="font-size:11px;color:#aaa;">Booking ID</span><br><span style="font-size:16px;color:#a5f3fc;font-weight:600;">' + bookingId + '</span></div><div style="background:#2b1b4e;border-radius:10px;padding:12px;margin-bottom:10px;"><span style="font-size:11px;color:#aaa;">Payment ID</span><br><span style="font-size:13px;color:#a5f3fc;word-break:break-all;">' + paymentId + '</span></div><div style="background:#2b1b4e;border-radius:10px;padding:12px;margin-bottom:10px;"><span style="font-size:11px;color:#aaa;">Amount Paid</span><br><span style="font-size:16px;color:#fcd34d;font-weight:600;">' + amountStr + '</span></div><div style="background:#2b1b4e;border-radius:10px;padding:12px;margin-bottom:20px;"><span style="font-size:11px;color:#aaa;">Location</span><br><span style="font-size:14px;color:#cbd5f5;">' + locationType + '</span></div><button class="btn" style="background:#7c3aed;width:100%;padding:14px;font-size:15px;" onclick="this.closest(\'div[id]\').remove();resetForm();">Done</button></div></div>';
    document.body.appendChild(modal);
}

function showErrorModal(errorMsg) {
    var existing = document.getElementById('errorModal'); if (existing) existing.remove();
    var modal = document.createElement('div'); modal.id = 'errorModal';
    modal.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;"><div class="modal-card" style="background:#1a0f2a;border-radius:18px;padding:30px;max-width:400px;width:100%;text-align:center;border:1px solid #ef4444;"><div style="font-size:50px;margin-bottom:10px;">&#128532;</div><h3 style="color:#ef4444;margin:0 0 12px 0;font-size:20px;">Payment Issue</h3><p style="color:#cbd5f5;line-height:1.7;font-size:14px;margin:0 0 20px 0;">' + (errorMsg || "Could not process payment.") + '</p><button class="btn" style="background:#7c3aed;width:100%;padding:14px;font-size:15px;" onclick="this.closest(\'div[id]\').remove();">Try Again</button></div></div>';
    document.body.appendChild(modal);
}

function resetForm() {
    cart = []; nameEl.value = ''; emailEl.value = ''; mobileEl.value = ''; dobEl.value = ''; queryEl.value = ''; dateEl.value = ''; timeEl.innerHTML = ''; agreeEl.checked = false; note.innerText = '';
    render(); toggleSections(); checkPay(); window.scrollTo({ top: 0, behavior: 'smooth' });
}

var daySlots = { 1:["11 AM","12 PM","4 PM","5 PM","6 PM","7 PM"], 2:["4 PM","5 PM","6 PM","7 PM"], 3:["11 AM","12 PM","4 PM","5 PM","6 PM","7 PM"], 4:["4 PM","5 PM","6 PM","7 PM"], 5:["4 PM","5 PM","6 PM","7 PM"], 6:["2 PM","3 PM","4 PM","5 PM","6 PM","7 PM"], 0:["11 AM","12 PM","1 PM","5 PM","6 PM","7 PM"] };

function updateRescheduleSlots() {
    var rDate = document.getElementById('rescheduleDate').value; var rTime = document.getElementById('rescheduleTime');
    if (!rDate) return;
    var d = new Date(rDate.split('-')[0], rDate.split('-')[1] - 1, rDate.split('-')[2]).getDay();
    rTime.innerHTML = '';
    (daySlots[d] || []).forEach(function(s) { var opt = document.createElement('option'); opt.value = s; opt.textContent = s; rTime.appendChild(opt); });
}
document.getElementById('rescheduleDate').addEventListener('change', updateRescheduleSlots);

function rescheduleBooking() {
    var id = document.getElementById('rescheduleId').value.trim(); var d = document.getElementById('rescheduleDate').value; var t = document.getElementById('rescheduleTime').value;
    if (!id || !d || !t) return alert("Fill all fields");
    window.open("https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent("\uD83D\uDD04 *Reschedule Request*\nID: " + id + "\nNew Date: " + d + "\nNew Time: " + t), '_blank');
}

function cancelBooking() {
    var id = document.getElementById('cancelId').value.trim();
    if (!id) return alert("Enter Booking ID");
    if (confirm("Are you sure? No refunds are applicable.")) { window.open("https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent("\u274C *Cancellation Request*\nID: " + id), '_blank'); }
}

function clearAllData() { if (confirm("Clear test data?")) { localStorage.removeItem('bookings'); alert("Cleared."); } }

function sendFeedback() {
    var m = document.getElementById('feedMobile').value.trim(); var e = document.getElementById('feedEmail').value.trim(); var t = document.getElementById('feedMsg').value.trim();
    if (!m || !e || !t) return alert("Fill all fields.");
    window.open("https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent("\uD83D\uDCDD *Feedback*\nMobile: " + m + "\nEmail: " + e + "\nFeedback: " + t), '_blank');
}

// FIX: Function to auto-detect user location based on Timezone
function autoDetectLocation() {
    var timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Check if the user is likely in India
    if (timeZone && (timeZone.includes('Asia/Kolkata') || timeZone.includes('India') || timeZone.includes('Calcutta'))) {
        locationEl.value = 'domestic';
    } else {
        locationEl.value = 'international';
    }
    // Trigger the change event to update the USD note visibility
    var event = new Event('change');
    locationEl.dispatchEvent(event);
}

fetchExchangeRate();

// Call auto-detect after a slight delay to ensure elements are ready
setTimeout(autoDetectLocation, 500);

document.getElementById('usdNote').style.display = 'none';