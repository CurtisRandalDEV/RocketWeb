// Mock service for WhatsApp Meta API

class WhatsAppService {
    async sendTemplateMessage(phone, templateName, variables) {
        // In a real app, you would make an HTTP POST request to the Meta API
        // using an access token: `https://graph.facebook.com/v17.0/PHONE_NUMBER_ID/messages`
        console.log('----------------------------------------------------');
        console.log(`[WhatsApp API Mock] Sending template: ${templateName}`);
        console.log(`[WhatsApp API Mock] To Phone: ${phone}`);
        console.log(`[WhatsApp API Mock] Variables:`, variables);
        console.log('----------------------------------------------------');
        return true;
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
