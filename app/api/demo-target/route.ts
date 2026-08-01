import { NextRequest, NextResponse } from 'next/server';

interface DemoItem {
  id: number;
  name: string;
  status: string;
  updatedAt: string;
}

interface ActivityLog {
  id: string;
  method: string;
  timestamp: string;
  details: string;
}

// In-memory demo state
let items: DemoItem[] = [
  { id: 101, name: "Database Backup Job", status: "ACTIVE", updatedAt: new Date().toISOString() },
  { id: 102, name: "Cache Cleanup Task", status: "PENDING", updatedAt: new Date().toISOString() },
];

let activityLogs: ActivityLog[] = [
  { id: 'log-1', method: 'INIT', timestamp: new Date().toISOString(), details: 'Demo Target initialized' }
];

function addLog(method: string, details: string) {
  activityLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    method,
    timestamp: new Date().toISOString(),
    details,
  });
  if (activityLogs.length > 20) activityLogs = activityLogs.slice(0, 20);
}

export async function GET() {
  addLog('GET', 'Fetched current item list');
  return NextResponse.json({
    status: 'ok',
    totalItems: items.length,
    items,
    recentActivity: activityLogs,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const newItem: DemoItem = {
      id: Date.now(),
      name: body.name || `Task #${items.length + 1}`,
      status: body.status || 'CREATED',
      updatedAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    addLog('POST', `Created new item: "${newItem.name}" (ID: ${newItem.id})`);
    return NextResponse.json({
      success: true,
      message: 'Item created successfully',
      item: newItem,
      totalItems: items.length,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'POST failed' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (items.length === 0) {
      // Re-seed if empty
      items.push({ id: 101, name: "Re-seeded Task", status: "UPDATED", updatedAt: new Date().toISOString() });
    }
    
    // Update the first item or matching item
    const targetId = body.id || items[0].id;
    const itemIndex = items.findIndex((i) => i.id === targetId);
    
    if (itemIndex !== -1) {
      items[itemIndex] = {
        ...items[itemIndex],
        name: body.name || `${items[itemIndex].name} (Updated)`,
        status: body.status || 'UPDATED',
        updatedAt: new Date().toISOString(),
      };
      addLog('PUT', `Updated item ID ${targetId} -> Status: ${items[itemIndex].status}`);
      return NextResponse.json({
        success: true,
        message: 'Item updated successfully',
        item: items[itemIndex],
      });
    }

    return NextResponse.json({ error: 'Item not found to update' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'PUT failed' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reset = searchParams.get('reset');

    if (reset === 'true') {
      items = [
        { id: 101, name: "Database Backup Job", status: "ACTIVE", updatedAt: new Date().toISOString() },
        { id: 102, name: "Cache Cleanup Task", status: "PENDING", updatedAt: new Date().toISOString() },
      ];
      addLog('RESET', 'Demo target state reset to defaults');
      return NextResponse.json({ success: true, message: 'State reset successfully', items });
    }

    if (items.length === 0) {
      addLog('DELETE', 'Attempted delete on empty list');
      return NextResponse.json({ success: true, message: 'List already empty', totalItems: 0 });
    }

    const removed = items.shift();
    addLog('DELETE', `Removed item: "${removed?.name}" (ID: ${removed?.id})`);
    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
      deletedItem: removed,
      remainingItems: items.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'DELETE failed' }, { status: 400 });
  }
}
