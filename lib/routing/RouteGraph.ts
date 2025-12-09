import L from 'leaflet';

export interface GraphNode {
  id: string;
  latlng: L.LatLng;
  tags: string[];
  edges: Map<string, number>;
}

export interface GraphEdge {
  id: string;
  nodeA: string;
  nodeB: string;
  distance: number;
  polylineId: string;
}

export class RouteGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private readonly MERGE_THRESHOLD = 0.5;

  addOrGetNode(latlng: L.LatLng, tags: string[] = []): GraphNode {
    const existingNode = this.findNodeAt(latlng);
    if (existingNode) {
      const mergedTags = Array.from(new Set([...existingNode.tags, ...tags]));
      existingNode.tags = mergedTags;
      console.log('📍 Reusing existing node:', existingNode.id, 'at', latlng);
      return existingNode;
    }

    const nodeId = `node-${Date.now()}-${Math.random()}`;
    const node: GraphNode = {
      id: nodeId,
      latlng,
      tags,
      edges: new Map(),
    };
    this.nodes.set(nodeId, node);
    console.log('📍 Created new node:', nodeId, 'at', latlng);
    return node;
  }

  findNodeAt(latlng: L.LatLng): GraphNode | null {
    for (const node of this.nodes.values()) {
      const distance = node.latlng.distanceTo(latlng);
      if (distance < this.MERGE_THRESHOLD) {
        return node;
      }
    }
    return null;
  }

  addEdge(nodeA: GraphNode, nodeB: GraphNode, polylineId: string): GraphEdge {
    const distance = nodeA.latlng.distanceTo(nodeB.latlng);
    const edgeId = `edge-${nodeA.id}-${nodeB.id}`;

    const existingEdge = this.edges.get(edgeId);
    if (existingEdge) {
      console.log('🔗 Reusing existing edge:', edgeId);
      return existingEdge;
    }

    const edge: GraphEdge = {
      id: edgeId,
      nodeA: nodeA.id,
      nodeB: nodeB.id,
      distance,
      polylineId,
    };

    this.edges.set(edgeId, edge);

    nodeA.edges.set(nodeB.id, distance);
    nodeB.edges.set(nodeA.id, distance);

    console.log('🔗 Created edge:', edgeId, `(${distance.toFixed(2)}m)`);
    return edge;
  }

  addPolyline(latlngs: L.LatLng[], polylineId: string): { nodes: GraphNode[], edges: GraphEdge[] } {
    const createdNodes: GraphNode[] = [];
    const createdEdges: GraphEdge[] = [];

    for (let i = 0; i < latlngs.length; i++) {
      const node = this.addOrGetNode(latlngs[i]);
      createdNodes.push(node);
    }

    for (let i = 0; i < createdNodes.length - 1; i++) {
      const edge = this.addEdge(createdNodes[i], createdNodes[i + 1], polylineId);
      createdEdges.push(edge);
    }

    console.log(`✅ Added polyline ${polylineId}:`, createdNodes.length, 'nodes,', createdEdges.length, 'edges');
    return { nodes: createdNodes, edges: createdEdges };
  }

  removePolyline(polylineId: string): void {
    const edgesToRemove: string[] = [];
    this.edges.forEach((edge, edgeId) => {
      if (edge.polylineId === polylineId) {
        edgesToRemove.push(edgeId);
      }
    });

    edgesToRemove.forEach(edgeId => {
      const edge = this.edges.get(edgeId);
      if (edge) {
        const nodeA = this.nodes.get(edge.nodeA);
        const nodeB = this.nodes.get(edge.nodeB);
        if (nodeA) nodeA.edges.delete(edge.nodeB);
        if (nodeB) nodeB.edges.delete(edge.nodeA);
        
        this.edges.delete(edgeId);
      }
    });

    const nodesToRemove: string[] = [];
    this.nodes.forEach((node, nodeId) => {
      if (node.edges.size === 0) {
        nodesToRemove.push(nodeId);
      }
    });

    nodesToRemove.forEach(nodeId => {
      this.nodes.delete(nodeId);
      console.log('🗑️ Removed orphaned node:', nodeId);
    });

    console.log(`🗑️ Removed polyline ${polylineId}:`, edgesToRemove.length, 'edges,', nodesToRemove.length, 'orphaned nodes');
  }

  updateNodeTags(nodeId: string, tags: string[]): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.tags = tags;
      console.log('🏷️ Updated tags for node:', nodeId, tags);
    }
  }

  getNodes(): Map<string, GraphNode> {
    return this.nodes;
  }

  getEdges(): Map<string, GraphEdge> {
    return this.edges;
  }

  getNode(nodeId: string): GraphNode | undefined {
    return this.nodes.get(nodeId);
  }

  getNeighbors(nodeId: string): { nodeId: string, distance: number }[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    return Array.from(node.edges.entries()).map(([neighborId, distance]) => ({
      nodeId: neighborId,
      distance,
    }));
  }

  printStats(): void {
    console.log('📊 Graph Statistics:');
    console.log('  Nodes:', this.nodes.size);
    console.log('  Edges:', this.edges.size);
    
    const connectionCounts = new Map<number, number>();
    this.nodes.forEach(node => {
      const count = node.edges.size;
      connectionCounts.set(count, (connectionCounts.get(count) || 0) + 1);
    });
    
    console.log('  Node connections:');
    connectionCounts.forEach((nodeCount, edgeCount) => {
      console.log(`    ${edgeCount} edges: ${nodeCount} nodes`);
    });
  }
}
