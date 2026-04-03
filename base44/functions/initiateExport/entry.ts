import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { event_id } = await req.json();

        if (!event_id) {
            return Response.json({ error: 'event_id is required' }, { status: 400 });
        }

        const exportTask = await base44.entities.ExportTask.create({
            event_id,
            status: 'pending',
            progress_percentage: 0
        });

        return Response.json({ export_task_id: exportTask.id });

    } catch (error) {
        console.error('Error initiating export:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});