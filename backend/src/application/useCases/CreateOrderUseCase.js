class CreateOrderUseCase {
    // Inyectamos las dependencias: el repo de la base de datos y el servicio de email
    constructor(orderRepository, emailServicePort) {
        this.orderRepository = orderRepository;
        this.emailServicePort = emailServicePort;
    }

    async execute(orderData) {
        // 1. Establecemos la regla de negocio: la orden nace como "Pendiente de Pago"
        const newOrder = {
            ...orderData,
            status: 'Pendiente de Pago',
            createdAt: new Date()
        };

        // 2. Guardamos en la base de datos (aquí asumo que tienes un método 'create' o 'save' en tu orderRepository)
        // Si aún no tienes un repositorio de órdenes completo, dejaremos la estructura lista para cuando lo conectes a PostgreSQL/MySQL
        let savedOrder;
        try {
            savedOrder = await this.orderRepository.create(newOrder);
        } catch (error) {
            console.error("Error al guardar la orden en la BD:", error);
            throw new Error("No se pudo crear la orden.");
        }

        // 3. Disparamos los correos de manera asíncrona
        // Lo ponemos en un try-catch para que si falla el correo, la orden NO se cancele (ya se guardó)
        try {
            // Correo al cliente
            await this.emailServicePort.sendOrderConfirmation(orderData.userEmail, savedOrder);
            
            // Correo al Super Admin (puedes cambiar el correo destino en el adapter luego)
            await this.emailServicePort.notifyAdminNewOrder(savedOrder);
            
            console.log(`Correos enviados exitosamente para la orden ${savedOrder.id}`);
        } catch (error) {
            console.error(`Error al enviar correos de la orden ${savedOrder.id}:`, error);
        }

        // Retornamos la orden guardada al frontend
        return savedOrder;
    }
}

module.exports = CreateOrderUseCase;