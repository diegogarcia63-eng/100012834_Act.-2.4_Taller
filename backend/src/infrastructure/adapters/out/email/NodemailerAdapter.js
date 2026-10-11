const nodemailer = require('nodemailer');
const EmailServicePort = require('../../../../application/ports/out/EmailServicePort');

class NodemailerAdapter extends EmailServicePort {
    constructor() {
        super();
        this.transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "03330a98ec7222", // 
                pass: "2572a1b03e252a"  // 
            }
        });
    }

    async sendOrderConfirmation(toEmail, order) {
        const mailOptions = {
            from: '"E-commerce Chiquitech" <no-reply@chiquitech.com>',
            to: toEmail,
            subject: `Instrucciones de Pago - Pedido #${order.id}`,
            html: `
                <h2>¡Gracias por tu compra!</h2>
                <p>Tu pedido <strong>#${order.id}</strong> ha sido registrado exitosamente y se encuentra en estado: <strong>${order.status}</strong>.</p>
                <h3>Desglose de tu compra:</h3>
                <p>Total a pagar: <strong>$${order.total}</strong></p>
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px;">
                    <h3>Instrucciones para transferencia bancaria:</h3>
                    <ul>
                        <li><strong>Banco:</strong> BBVA</li>
                        <li><strong>Titular:</strong> NEXO 5 SA de CV</li>
                        <li><strong>CLABE:</strong> 012345678901234567</li>
                        <li><strong>Concepto de pago:</strong> Pedido ${order.id}</li>
                    </ul>
                    <p><em>Por favor, una vez realizado el pago, responde a este correo adjuntando tu comprobante.</em></p>
                </div>
            `
        };
        await this.transporter.sendMail(mailOptions);
    }

    async notifyAdminNewOrder(order) {
        const mailOptions = {
            from: '"Sistema E-commerce" <system@chiquitech.com>',
            to: "admin@chiquitech.com",
            subject: `🚨 Nuevo Pedido Registrado #${order.id}`,
            html: `<p>Se ha registrado un nuevo pedido por $${order.total}. Esperando comprobante de pago.</p>`
        };
        await this.transporter.sendMail(mailOptions);
    }
}

// CORRECCIÓN IMPORTANTE AQUÍ:
module.exports = NodemailerAdapter;