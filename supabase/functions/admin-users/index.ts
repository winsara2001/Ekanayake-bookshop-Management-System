import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    // Client for verifying the caller
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Not authenticated')
    }

    // Verify Admin Role
    const { data: profile, error: profileError } = await supabaseClient
      .from('staff_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin' || !profile.is_active) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Admin Client (Service Role)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const reqData = await req.json()
    const { action, payload } = reqData

    if (action === 'list') {
      // Fetch auth.users
      const { data: authData, error: authErr } = await adminClient.auth.admin.listUsers()
      if (authErr) throw authErr

      const authUsers = authData.users

      // Fetch customer_profiles
      const { data: customers } = await adminClient.from('customer_profiles').select('*')
      // Fetch staff_profiles
      const { data: staff } = await adminClient.from('staff_profiles').select('*')

      const combined = authUsers.map(au => {
        const staffProf = staff?.find(s => s.id === au.id)
        const custProf = customers?.find(c => c.id === au.id)
        
        let account_type = 'Customer'
        let role = 'customer'
        let is_active = true
        let name = ''

        if (staffProf) {
          if (staffProf.role === 'admin') account_type = 'Admin';
          else if (staffProf.role === 'inventory_manager') account_type = 'Inventory Manager';
          else if (staffProf.role === 'sales_manager') account_type = 'Sales Manager';
          else account_type = 'Staff';

          role = staffProf.role
          is_active = staffProf.is_active
          name = `${staffProf.first_name} ${staffProf.last_name}`
        } else if (custProf) {
          name = `${custProf.first_name} ${custProf.last_name}`
        }

        return {
          id: au.id,
          email: au.email,
          name: name.trim() || 'Unknown',
          account_type,
          role,
          is_active,
          created_at: au.created_at
        }
      })

      return new Response(JSON.stringify({ success: true, data: combined }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'assign_staff') {
      const { userId, role } = payload
      // role defaults to inventory_manager if not provided
      const targetRole = role || 'inventory_manager';
      
      const { error: rpcErr } = await adminClient.rpc('promote_customer_to_staff', { target_user_id: userId, p_role: targetRole })
      if (rpcErr) throw rpcErr
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'update_role') {
      const { userId, role } = payload
      // Safety check: Cannot demote self
      if (userId === user.id && role !== 'admin') {
         throw new Error("You cannot change your own admin role.")
      }
      
      const { error: updErr } = await adminClient.from('staff_profiles').update({ role }).eq('id', userId)
      if (updErr) throw updErr

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'set_active_status') {
      const { userId, is_active } = payload
      // Safety check: Cannot deactivate self
      if (userId === user.id && !is_active) {
         throw new Error("You cannot deactivate your own account.")
      }
      
      const { error: updErr } = await adminClient.from('staff_profiles').update({ is_active }).eq('id', userId)
      if (updErr) throw updErr

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'delete_staff') {
      const { userId } = payload
      
      if (userId === user.id) {
        throw new Error("You cannot delete your own Admin account.")
      }

      // Check if target is admin and if it's the last active admin
      const { data: targetProfile } = await adminClient.from('staff_profiles').select('*').eq('id', userId).single()
      if (!targetProfile) {
        throw new Error("Target staff profile not found.")
      }

      if (targetProfile.role === 'admin' && targetProfile.is_active) {
        const { count } = await adminClient.from('staff_profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin').eq('is_active', true)
        if (count && count <= 1) {
          throw new Error("At least one active Admin account must remain.")
        }
      }

      // Safe to remove staff access: create customer profile using staff details
      await adminClient.from('customer_profiles').upsert({
        id: userId,
        first_name: targetProfile.first_name,
        last_name: targetProfile.last_name,
        phone: targetProfile.phone
      })

      // Delete staff profile
      const { error: delErr } = await adminClient.from('staff_profiles').delete().eq('id', userId)
      if (delErr) throw delErr

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid action')

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
