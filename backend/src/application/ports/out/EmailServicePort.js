class EmailServicePort {
    async sendOrderConfirmation(toEmail, orderDetails) {
        throw new Error("Método sendOrderConfirmation no implementado");
    }
    
    async notifyAdminNewOrder(orderDetails) {
        throw new Error("Método notifyAdminNewOrder no implementado");
    }
}

module.exports = EmailServicePort;