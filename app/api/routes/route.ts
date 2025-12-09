import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { RoutePolylineInsert } from '@/types/database';

/** Fetches route polylines with optional filtering */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const isPublic = searchParams.get('is_public');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('route_polylines')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (isPublic === 'true') {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching route polylines:', error);
      return NextResponse.json(
        { error: 'Failed to fetch route polylines' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/** Creates or updates route polylines in batch */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { polylines } = body as { 
      polylines: Array<(Omit<RoutePolylineInsert, 'created_by'> & { id?: string })>
    };

    if (!polylines || !Array.isArray(polylines) || polylines.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: polylines array is required' },
        { status: 400 }
      );
    }

    for (const polyline of polylines) {
      if (!polyline.coordinates || !Array.isArray(polyline.coordinates)) {
        return NextResponse.json(
          { error: 'Invalid request: each polyline must have coordinates array' },
          { status: 400 }
        );
      }

      if (polyline.coordinates.length < 2) {
        return NextResponse.json(
          { error: 'Invalid request: each polyline must have at least 2 points' },
          { status: 400 }
        );
      }
    }

    const toInsert = polylines
      .filter(p => !p.id)
      .map(({ id, ...polyline }) => ({
        ...polyline,
        created_by: user.id,
      }));

    const toUpdate = polylines.filter(p => p.id);

    const results = [];
    if (toInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('route_polylines')
        .insert(toInsert)
        .select();

      if (insertError) {
        console.error('Error inserting route polylines:', insertError);
        return NextResponse.json(
          { error: 'Failed to insert route polylines' },
          { status: 500 }
        );
      }

      results.push(...(inserted || []));
    }

    // Handle updates
    for (const update of toUpdate) {
      const { id, ...updateData } = update;

      const { data: updated, error: updateError } = await supabase
        .from('route_polylines')
        .update(updateData)
        .eq('id', id)
        .eq('created_by', user.id)
        .is('deleted_at', null)
        .select()
        .single();

      if (updateError) {
        console.error(`Error updating route polyline ${id}:`, updateError);
        return NextResponse.json(
          { error: `Failed to update route polyline ${id}` },
          { status: 500 }
        );
      }

      if (updated) {
        results.push(updated);
      }
    }

    return NextResponse.json({ data: results }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/** PUT - Update existing route polylines (batch update) */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { updates } = body as { updates: Array<{ id: string } & RoutePolylineUpdate> }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: updates array is required' },
        { status: 400 }
      )
    }

    const results = []
    
    for (const update of updates) {
      const { id, ...updateData } = update

      if (!id) {
        return NextResponse.json(
          { error: 'Invalid request: each update must have an id' },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from('route_polylines')
        .update(updateData)
        .eq('id', id)
        .eq('created_by', user.id)
        .is('deleted_at', null)
        .select()
        .single()

      if (error) {
        console.error(`Error updating route polyline ${id}:`, error)
        return NextResponse.json(
          { error: `Failed to update route polyline ${id}` },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json(
          { error: `Route polyline ${id} not found or you don't have permission` },
          { status: 404 }
        )
      }

      results.push(data)
    }

    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/** DELETE - Soft delete route polylines */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')?.split(',') || []

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids parameter is required' },
        { status: 400 }
      )
    }

    console.log('🗑️ Attempting to delete routes:', ids);
    console.log('👤 User ID:', user.id);

    const { data, error } = await supabase
      .from('route_polylines')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids)
      .eq('created_by', user.id)
      .is('deleted_at', null)
      .select()

    if (error) {
      console.error('Error deleting route polylines:', error)
      return NextResponse.json(
        { error: 'Failed to delete route polylines' },
        { status: 500 }
      )
    }

    console.log('✅ Deleted routes:', data);

    return NextResponse.json({ 
      data,
      message: `Successfully deleted ${data.length} route polyline(s)` 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
