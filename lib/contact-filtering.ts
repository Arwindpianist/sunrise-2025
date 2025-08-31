import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Helper function to filter contacts by category, supporting both old single category
 * and new multiple categories systems
 */
export async function filterContactsByCategory(
  supabase: SupabaseClient,
  userId: string,
  category: string | null | undefined
) {
  // If no category or "all"/"general", return all contacts
  if (!category || category === "all" || category === "general") {
    return { data: null, error: null, useNewSystem: false }
  }

  try {
    // First try to find contacts with the new multiple categories system
    // Use a more direct approach by querying the junction table with proper user filtering
    const { data: categoryContacts, error: categoryError } = await supabase
      .from('contact_category_assignments')
      .select(`
        contact_id,
        contacts!inner (
          id,
          user_id
        ),
        contact_categories!inner (
          name
        )
      `)
      .eq('contacts.user_id', userId)
      .eq('contact_categories.name', category)

    if (!categoryError && categoryContacts && categoryContacts.length > 0) {
      // Use the new system
      return { 
        data: categoryContacts, 
        error: null, 
        useNewSystem: true,
        contactIds: categoryContacts.map((cca: any) => cca.contact_id)
      }
    } else {
      // Fallback to old single category system
      return { data: null, error: null, useNewSystem: false }
    }
  } catch (error) {
    console.error('Error filtering contacts by category:', error)
    return { data: null, error, useNewSystem: false }
  }
}

/**
 * Build a contacts query that works with both old and new category systems
 */
export async function buildContactsQuery(
  supabase: SupabaseClient,
  userId: string,
  category: string | null | undefined
) {
  let contactsQuery = supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)

  if (category && category !== "all" && category !== "general") {
    const filterResult = await filterContactsByCategory(supabase, userId, category)
    
    if (filterResult.useNewSystem && filterResult.contactIds) {
      // Use the new system - filter by contact IDs
      contactsQuery = contactsQuery.in('id', filterResult.contactIds)
    } else {
      // Fallback to old single category system
      contactsQuery = contactsQuery.eq('category', category)
    }
  }

  return contactsQuery
}

/**
 * Count contacts by category, supporting both systems
 */
export async function countContactsByCategory(
  supabase: SupabaseClient,
  userId: string,
  category: string | null | undefined
) {
  let contactsQuery = supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (category && category !== "all" && category !== "general") {
    const filterResult = await filterContactsByCategory(supabase, userId, category)
    
    if (filterResult.useNewSystem && filterResult.contactIds) {
      // Use the new system - filter by contact IDs
      contactsQuery = contactsQuery.in('id', filterResult.contactIds)
    } else {
      // Fallback to old single category system
      contactsQuery = contactsQuery.eq('category', category)
    }
  }

  return contactsQuery
}
