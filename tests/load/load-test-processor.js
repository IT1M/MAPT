module.exports = {
  // Generate random string for unique test data
  $randomString: function (context, events, done) {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return done(result);
  },

  // Generate random number in range
  $randomNumber: function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
};
