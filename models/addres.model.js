const addressSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, default: "Home" },
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String,
}, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);