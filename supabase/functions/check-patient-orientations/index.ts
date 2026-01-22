import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pre-transplant tasks with their deadlines
const preTransplantTasks = [
  { id: 'exames', title: 'Exames solicitados', daysBeforeD0: 7 },
  { id: 'consulta', title: 'Consulta pré-operatória', daysBeforeD0: 3 },
  { id: 'minoxidil', title: 'Parar Minoxidil', daysBeforeD0: 7 },
  { id: 'aspirina', title: 'Parar AAS/Aspirina', daysBeforeD0: 7 },
  { id: 'vitaminas', title: 'Parar vitamina E', daysBeforeD0: 7 },
  { id: 'alcool', title: 'Evitar álcool', daysBeforeD0: 5 },
  { id: 'cigarro', title: 'Parar de fumar', daysBeforeD0: 7 },
  { id: 'cabelo', title: 'Lavar o cabelo', daysBeforeD0: 0 },
];

// Post-transplant tasks with their day requirements
const postTransplantTasks = [
  { day: 1, tasks: [
    { id: 'd1_soro', title: 'Borrifar soro' },
    { id: 'd1_dormir', title: 'Dormir de barriga para cima' },
    { id: 'd1_gelo', title: 'Aplicar gelo na testa' },
  ]},
  { day: 2, tasks: [
    { id: 'd2_soro', title: 'Continuar soro' },
    { id: 'd2_medicacao', title: 'Tomar medicação' },
    { id: 'd2_repouso', title: 'Manter repouso' },
  ]},
  { day: 3, tasks: [
    { id: 'd3_lavar', title: 'Primeira lavagem suave' },
    { id: 'd3_doadora', title: 'Esfregar área doadora' },
    { id: 'd3_secar', title: 'Secar ao vento' },
  ]},
  { day: 5, tasks: [
    { id: 'd5_lavagem', title: 'Lavagem cuidadosa' },
    { id: 'd5_espuma', title: 'Aplicar espuma suave' },
    { id: 'd5_cafe', title: 'Pode voltar café moderado' },
  ]},
  { day: 8, tasks: [
    { id: 'd8_circular', title: 'Movimentos circulares' },
    { id: 'd8_lado', title: 'Pode dormir de lado' },
    { id: 'd8_camisa', title: 'Camisas com botão' },
  ]},
  { day: 10, tasks: [
    { id: 'd10_oleo', title: 'Iniciar óleo de girassol' },
    { id: 'd10_academia', title: 'Academia leve liberada' },
    { id: 'd10_crostas', title: 'Crostas soltando' },
  ]},
  { day: 15, tasks: [
    { id: 'd15_chuveiro', title: 'Chuveiro normal liberado' },
    { id: 'd15_shampoo', title: 'Shampoo regular' },
    { id: 'd15_massagem', title: 'Massagens liberadas' },
  ]},
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get all patients with surgery dates
    const { data: patients, error: patientsError } = await supabase
      .from('neohub_users')
      .select('id, full_name, phone, surgery_date, email')
      .not('surgery_date', 'is', null)
      .eq('is_active', true);

    if (patientsError) throw patientsError;

    let overdueCount = 0;
    let notificationsSent = 0;
    let tasksCreated = 0;

    for (const patient of patients || []) {
      const surgeryDate = new Date(patient.surgery_date);
      const surgeryDay = new Date(surgeryDate.getFullYear(), surgeryDate.getMonth(), surgeryDate.getDate());
      const currentDay = Math.floor((today.getTime() - surgeryDay.getTime()) / (1000 * 60 * 60 * 24));

      // Get patient's completed tasks
      const { data: completedTasks } = await supabase
        .from('patient_orientation_progress')
        .select('task_id, completed_at')
        .eq('patient_id', patient.id);

      const completedTaskIds = new Set((completedTasks || []).map(t => t.task_id));

      // Check pre-transplant tasks for patients before surgery
      if (currentDay < 0) {
        for (const task of preTransplantTasks) {
          const taskDeadline = new Date(surgeryDay);
          taskDeadline.setDate(taskDeadline.getDate() - task.daysBeforeD0);
          
          if (today >= taskDeadline && !completedTaskIds.has(task.id)) {
            await handleOverdueTask(supabase, patient, task.id, task.title, 'pre', -task.daysBeforeD0);
            overdueCount++;
          }
        }
      }

      // Check post-transplant tasks for patients after surgery
      if (currentDay > 0) {
        for (const dayGroup of postTransplantTasks) {
          if (currentDay > dayGroup.day) {
            for (const task of dayGroup.tasks) {
              if (!completedTaskIds.has(task.id)) {
                await handleOverdueTask(supabase, patient, task.id, task.title, 'post', dayGroup.day);
                overdueCount++;
              }
            }
          }
        }
      }

      // Send reminder notifications
      const notifications = await sendReminders(supabase, patient, currentDay, surgeryDate, completedTaskIds);
      notificationsSent += notifications;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Checked ${patients?.length || 0} patients`,
        overdueCount,
        notificationsSent,
        tasksCreated
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleOverdueTask(
  supabase: any, 
  patient: any, 
  taskId: string, 
  taskTitle: string,
  taskType: string,
  taskDay: number
) {
  // Check if task already marked as overdue
  const { data: existing } = await supabase
    .from('patient_orientation_progress')
    .select('id, is_overdue')
    .eq('patient_id', patient.id)
    .eq('task_id', taskId)
    .single();

  if (!existing) {
    // Create overdue task record
    await supabase.from('patient_orientation_progress').insert({
      patient_id: patient.id,
      task_id: taskId,
      task_type: taskType,
      task_day: taskDay,
      is_overdue: true,
      overdue_at: new Date().toISOString()
    });
  } else if (!existing.is_overdue) {
    // Mark as overdue
    await supabase.from('patient_orientation_progress')
      .update({ is_overdue: true, overdue_at: new Date().toISOString() })
      .eq('id', existing.id);
  }

  // Check if team task already exists
  const { data: existingTask } = await supabase
    .from('patient_followup_tasks')
    .select('id')
    .eq('patient_id', patient.id)
    .eq('task_id', taskId)
    .single();

  if (!existingTask) {
    // Create task for pós-vendas team
    const { data: neoteamTask, error: taskError } = await supabase
      .from('neoteam_tasks')
      .insert({
        title: `⚠️ Paciente atrasado: ${taskTitle}`,
        description: `O paciente ${patient.full_name} não completou a tarefa "${taskTitle}". Contato: ${patient.phone || patient.email}`,
        priority: 'high',
        status: 'todo',
        category: 'Pós-Vendas',
        tags: ['orientacao-atrasada', 'paciente'],
        due_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (neoteamTask) {
      // Link the task
      await supabase.from('patient_followup_tasks').insert({
        patient_id: patient.id,
        task_id: taskId,
        neoteam_task_id: neoteamTask.id
      });
    }
  }
}

async function sendReminders(
  supabase: any,
  patient: any,
  currentDay: number,
  surgeryDate: Date,
  completedTaskIds: Set<string>
) {
  let sent = 0;
  const now = new Date();

  // Get tasks for current day
  let todayTasks: { id: string; title: string; time?: string }[] = [];
  
  if (currentDay > 0) {
    const dayGroup = postTransplantTasks.find(d => d.day === currentDay);
    if (dayGroup) {
      todayTasks = dayGroup.tasks.filter(t => !completedTaskIds.has(t.id));
    }
  }

  // For each incomplete task today, check notification schedule
  for (const task of todayTasks) {
    // Define notification schedule: on_time, 30min, 1h, 2h
    const schedules = [
      { type: 'on_time', offsetMinutes: 0 },
      { type: '30min', offsetMinutes: 30 },
      { type: '1h', offsetMinutes: 60 },
      { type: '2h', offsetMinutes: 120 },
    ];

    for (const schedule of schedules) {
      // Check if already sent
      const { data: existingNotif } = await supabase
        .from('patient_orientation_notifications')
        .select('id')
        .eq('patient_id', patient.id)
        .eq('task_id', task.id)
        .eq('notification_type', schedule.type)
        .single();

      if (!existingNotif) {
        // Check if it's time to send
        const taskDate = new Date(surgeryDate);
        taskDate.setDate(taskDate.getDate() + currentDay);
        taskDate.setHours(9, 0, 0, 0); // Default task time 9 AM
        taskDate.setMinutes(taskDate.getMinutes() + schedule.offsetMinutes);

        if (now >= taskDate) {
          // Send WhatsApp notification
          await sendWhatsAppNotification(supabase, patient, task, schedule.type);
          
          // Record notification sent
          await supabase.from('patient_orientation_notifications').insert({
            patient_id: patient.id,
            task_id: task.id,
            notification_type: schedule.type,
            channel: 'whatsapp',
            status: 'sent'
          });
          
          sent++;
        }
      }
    }
  }

  return sent;
}

async function sendWhatsAppNotification(
  supabase: any,
  patient: any,
  task: { id: string; title: string },
  notificationType: string
) {
  if (!patient.phone) return;

  // Get WhatsApp settings
  const { data: settings } = await supabase
    .from('neoteam_settings')
    .select('whatsapp_instance_url, whatsapp_api_token')
    .limit(1)
    .single();

  if (!settings?.whatsapp_instance_url || !settings?.whatsapp_api_token) {
    console.log('WhatsApp not configured');
    return;
  }

  const messages: Record<string, string> = {
    'on_time': `🏥 Olá ${patient.full_name}! Hora de: *${task.title}*\n\nAcesse o app NeoCare para ver detalhes.`,
    '30min': `⏰ Lembrete: Você ainda não completou *${task.title}*\n\nAcesse o app para marcar como feito!`,
    '1h': `📢 Atenção ${patient.full_name}! A tarefa *${task.title}* está pendente há 1 hora.\n\nÉ importante para sua recuperação!`,
    '2h': `⚠️ Último lembrete: *${task.title}*\n\nNossa equipe de pós-vendas entrará em contato para ajudar.`,
  };

  const message = messages[notificationType] || messages['on_time'];

  try {
    const phone = patient.phone.replace(/\D/g, '');
    const response = await fetch(`${settings.whatsapp_instance_url}/message/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': settings.whatsapp_api_token,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    });

    console.log(`WhatsApp sent to ${phone}: ${notificationType}`);
  } catch (error) {
    console.error('WhatsApp error:', error);
  }
}
