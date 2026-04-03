import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { eventId, templateStyle = 'classic' } = await req.json();

        // Check if user is authenticated
        let currentUser;
        try {
            currentUser = await base44.auth.me();
        } catch (_error) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Try to get the event using user-scoped call first
        let events;
        try {
            events = await base44.entities.Event.filter({ id: eventId });
        } catch (_error) {
            // If user-scoped call fails, try service role (for admin users)
            if (currentUser.role === 'admin') {
                events = await base44.asServiceRole.entities.Event.filter({ id: eventId });
            } else {
                return new Response(JSON.stringify({ error: 'Event not found or access denied' }), { 
                    status: 404, 
                    headers: { 'Content-Type': 'application/json' } 
                });
            }
        }

        if (!events || events.length === 0) {
            return new Response(JSON.stringify({ error: 'Event not found' }), { 
                status: 404, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        const event = events[0];

        // Authorization check: Admin OR event creator
        if (currentUser.role !== 'admin' && event.created_by !== currentUser.email) {
            return new Response(JSON.stringify({ error: 'Access denied' }), { 
                status: 403, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        const baseUrl = req.headers.get('origin') || 'https://app.memoria.co.il';
        const eventUrl = `${baseUrl}/Event?code=${event.unique_code}&pin=${event.pin_code}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(eventUrl)}&bgcolor=FFFFFF&color=000000&margin=0`;

        const qrResponse = await fetch(qrUrl);
        if (!qrResponse.ok) throw new Error('Failed to generate QR code');
        const qrArrayBuffer = await qrResponse.arrayBuffer();
        const qrBase64 = btoa(String.fromCharCode(...new Uint8Array(qrArrayBuffer)));

        const eventDate = new Date(event.date).toLocaleDateString('he-IL', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });

        const safeName = escapeHtml(event.name);

        let htmlContent = '';

        if (templateStyle === 'minimal') {
            // New Minimal Template
            htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <title>דף הדפסה מינימלי - ${safeName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            width: 210mm;
            height: 297mm;
            font-family: 'Assistant', sans-serif;
            background-color: #FFFFFF;
            direction: rtl;
            overflow: hidden;
            position: relative;
        }
        
        .page {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            padding: 30mm 25mm;
        }
        
        /* Decorative corner elements */
        .corner-top-right {
            position: absolute;
            top: 20mm;
            right: 20mm;
            width: 30mm;
            height: 30mm;
            border-top: 1px solid #D3D3D3;
            border-right: 1px solid #D3D3D3;
        }
        
        .corner-bottom-left {
            position: absolute;
            bottom: 20mm;
            left: 20mm;
            width: 30mm;
            height: 30mm;
            border-bottom: 1px solid #D3D3D3;
            border-left: 1px solid #D3D3D3;
        }

        /* Header section */
        .header-section {
            text-align: center;
            margin-bottom: 40mm;
        }
        
        .text-shared {
            font-size: 14pt;
            font-weight: 600;
            color: #666666;
            letter-spacing: 3px;
            margin-bottom: 8mm;
            text-transform: uppercase;
        }
        
        .text-event-name {
            font-size: 22pt;
            font-weight: 700;
            color: #333333;
            margin-bottom: 3mm;
            line-height: 1.2;
        }
        
        .text-camera-hebrew {
            font-family: 'Dancing Script', cursive;
            font-size: 42pt;
            font-weight: 700;
            color: #333333;
            line-height: 1;
            position: relative;
            display: inline-block;
            margin-bottom: 5mm;
        }
        
        .text-camera-hebrew::after {
            content: '';
            position: absolute;
            bottom: -5pt;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            height: 2pt;
            background: linear-gradient(90deg, transparent, #A0C2B9, transparent);
            border-radius: 2pt;
        }
        
        .text-event-date {
            font-size: 11pt;
            color: #888888;
            margin-top: 3mm;
            font-weight: 400;
        }

        /* QR Code section */
        .qr-section {
            margin-bottom: 40mm;
        }
        
        .qr-container {
            width: 55mm;
            height: 55mm;
            background: #FFFFFF;
            padding: 5mm;
            border: 1px solid #E8E8E8;
            border-radius: 3mm;
            box-shadow: 0 2mm 8mm rgba(0,0,0,0.05);
        }
        
        .qr-code {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        /* Footer section */
        .footer-section {
            text-align: center;
        }
        
        .text-scan-qr {
            font-size: 16pt;
            font-weight: 700;
            color: #333333;
            letter-spacing: 2px;
            margin-bottom: 8mm;
            text-transform: uppercase;
        }
        
        .text-photos-info {
            font-size: 12pt;
            color: #777777;
            line-height: 1.6;
            font-weight: 400;
        }
        
        .text-photos-number {
            font-weight: 600;
            color: #555555;
        }

        /* Print specific styles */
        @media print {
            html, body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color-adjust: exact;
            }
            
            @page {
                size: A4;
                margin: 0;
            }
            
            .page {
                page-break-after: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Decorative corners -->
        <div class="corner-top-right"></div>
        <div class="corner-bottom-left"></div>

        <!-- Header section -->
        <div class="header-section">
            <div class="text-shared">אלבום משותף</div>
            <div class="text-event-name">${safeName}</div>
            <div class="text-camera-hebrew">מצלמת זיכרונות</div>
            <div class="text-event-date">${eventDate}</div>
        </div>

        <!-- QR Code section -->
        <div class="qr-section">
            <div class="qr-container">
                <img src="data:image/png;base64,${qrBase64}" class="qr-code" alt="QR Code">
            </div>
        </div>

        <!-- Footer section -->
        <div class="footer-section">
            <div class="text-scan-qr">סרקו את קוד ה-QR</div>
            <div class="text-photos-info">
                תוכלו להעלות עד <span class="text-photos-number">${event.max_uploads_per_user || 25} תמונות</span> מהאירוע<br>
                שתפו את רגעי השמחה שלכם!
            </div>
        </div>
    </div>
</body>
</html>`;
        } else {
            // Classic Template (Original)
            htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <title>דף הדפסה קלאסי - ${safeName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            width: 210mm;
            height: 297mm;
            font-family: 'Assistant', sans-serif;
            background-color: #FFFFFF;
            direction: rtl;
            overflow: hidden;
            position: relative;
        }
        
        .page {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            padding: 30mm 25mm;
        }
        
        /* Decorative corner elements */
        .corner-top-right {
            position: absolute;
            top: 20mm;
            right: 20mm;
            width: 30mm;
            height: 30mm;
            border-top: 1px solid #D3D3D3;
            border-right: 1px solid #D3D3D3;
        }
        
        .corner-bottom-left {
            position: absolute;
            bottom: 20mm;
            left: 20mm;
            width: 30mm;
            height: 30mm;
            border-bottom: 1px solid #D3D3D3;
            border-left: 1px solid #D3D3D3;
        }

        /* Header section */
        .header-section {
            text-align: center;
            margin-bottom: 40mm;
        }
        
        .text-shared {
            font-size: 14pt;
            font-weight: 600;
            color: #666666;
            letter-spacing: 3px;
            margin-bottom: 8mm;
            text-transform: uppercase;
        }
        
        .text-event-name {
            font-size: 22pt;
            font-weight: 700;
            color: #333333;
            margin-bottom: 3mm;
            line-height: 1.2;
        }
        
        .text-camera-hebrew {
            font-family: 'Dancing Script', cursive;
            font-size: 42pt;
            font-weight: 700;
            color: #333333;
            line-height: 1;
            position: relative;
            display: inline-block;
            margin-bottom: 5mm;
        }
        
        .text-camera-hebrew::after {
            content: '';
            position: absolute;
            bottom: -5pt;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            height: 2pt;
            background: linear-gradient(90deg, transparent, #A0C2B9, transparent);
            border-radius: 2pt;
        }
        
        .text-event-date {
            font-size: 11pt;
            color: #888888;
            margin-top: 3mm;
            font-weight: 400;
        }

        /* QR Code section */
        .qr-section {
            margin-bottom: 40mm;
        }
        
        .qr-container {
            width: 55mm;
            height: 55mm;
            background: #FFFFFF;
            padding: 5mm;
            border: 1px solid #E8E8E8;
            border-radius: 3mm;
            box-shadow: 0 2mm 8mm rgba(0,0,0,0.05);
        }
        
        .qr-code {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        /* Footer section */
        .footer-section {
            text-align: center;
        }
        
        .text-scan-qr {
            font-size: 16pt;
            font-weight: 700;
            color: #333333;
            letter-spacing: 2px;
            margin-bottom: 8mm;
            text-transform: uppercase;
        }
        
        .text-photos-info {
            font-size: 12pt;
            color: #777777;
            line-height: 1.6;
            font-weight: 400;
        }
        
        .text-photos-number {
            font-weight: 600;
            color: #555555;
        }

        /* Print specific styles */
        @media print {
            html, body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color-adjust: exact;
            }
            
            @page {
                size: A4;
                margin: 0;
            }
            
            .page {
                page-break-after: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Decorative corners -->
        <div class="corner-top-right"></div>
        <div class="corner-bottom-left"></div>

        <!-- Header section -->
        <div class="header-section">
            <div class="text-shared">אלבום משותף</div>
            <div class="text-event-name">${safeName}</div>
            <div class="text-camera-hebrew">מצלמת זיכרונות</div>
            <div class="text-event-date">${eventDate}</div>
        </div>

        <!-- QR Code section -->
        <div class="qr-section">
            <div class="qr-container">
                <img src="data:image/png;base64,${qrBase64}" class="qr-code" alt="QR Code">
            </div>
        </div>

        <!-- Footer section -->
        <div class="footer-section">
            <div class="text-scan-qr">סרקו את קוד ה-QR</div>
            <div class="text-photos-info">
                תוכלו להעלות עד <span class="text-photos-number">${event.max_uploads_per_user || 25} תמונות</span> מהאירוע<br>
                שתפו את רגעי השמחה שלכם!
            </div>
        </div>
    </div>
</body>
</html>`;
        }

        const htmlBase64 = btoa(unescape(encodeURIComponent(htmlContent)));
        const stylePrefix = templateStyle === 'minimal' ? 'מינימלי' : 'קלאסי';
        
        const safeFileName = event.name.replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '');
        return new Response(JSON.stringify({
            success: true,
            fileName: `${safeFileName}_דף_הדפסה_${stylePrefix}.html`,
            fileContent: htmlBase64,
            contentType: 'text/html'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error generating printable page:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal Server Error',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});