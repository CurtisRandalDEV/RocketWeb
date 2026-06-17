// Mock service for WhatsApp Meta API

class WhatsAppService {
    async sendTemplateMessage(phone, templateName, variables) {
        if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) {
            console.warn('[WhatsApp] Faltan variables de entorno (WHATSAPP_TOKEN, WHATSAPP_PHONE_ID). Simulando envío: ', templateName);
            return true;
        }

        const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
        
        let components = [];
        if (variables && Object.keys(variables).length > 0) {
            components = [{
                type: "body",
                parameters: Object.values(variables).map(val => ({
                    type: "text",
                    text: String(val)
                }))
            }];
        }

        const payload = {
            messaging_product: "whatsapp",
            to: phone,
            type: "template",
            template: {
                name: templateName,
                language: { code: "es_MX" },
                components: components
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            
            if (!response.ok) {
                console.error('[WhatsApp API Error]', data);
                return false;
            }
            
            console.log(`[WhatsApp] Mensaje '${templateName}' enviado a ${phone}`);
            return true;
        } catch (error) {
            console.error('[WhatsApp API Error]', error);
            return false;
        }
    }

    async notifyTicketCreated(phone, ticketId, project) {
        if (!phone) return;
        return this.sendTemplateMessage(phone, 'ticket_received', { ticketId, project });
    }

    async notifyTicketStatusChanged(phone, ticketId, newStatus) {
        if (!phone) return;
        return this.sendTemplateMessage(phone, 'ticket_status_update', { ticketId, newStatus });
    }

    async notifyTicketCompleted(phone, ticketId) {
        if (!phone) return;
        return this.sendTemplateMessage(phone, 'ticket_resolved', { ticketId });
    }
}

module.exports = new WhatsAppService();
