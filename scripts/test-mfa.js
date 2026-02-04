try {
    const otplib = require('otplib');
    console.log('Type of otplib:', typeof otplib);
    console.log('Exports:', Object.keys(otplib));

    if (otplib.authenticator) {
        console.log('authenticator found');
        console.log('Secret:', otplib.authenticator.generateSecret());
    } else {
        console.log('authenticator NOT found directly');
        if (otplib.default) {
            console.log('Checking default export:', Object.keys(otplib.default));
        }
    }
} catch (e) {
    console.error('Crash:', e);
}
