import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Import existing app services (CommonJS modules can be default-imported in ESM)
import CONFIG from "../config.js";
import APS from "../services/aps.js";
import IOT from "../services/iot.mocked.js";

const mcpServer = new McpServer({
  name: "aps-intc-data-viz",
  version: "0.1.0",
});

// get_public_token
mcpServer.registerTool(
  "get_public_token",
  {
    title: "Get APS public token",
    description: "Retrieve a public access token for Autodesk Platform Services (2-legged).",
  },
  async () => {
    const token = await APS.getPublicToken();
    return {
      content: [{ type: "text", text: "Retrieved APS token" }],
      structuredContent: token,
    };
  }
);

// get_sensors
mcpServer.registerTool(
  "get_sensors",
  {
    title: "List sensors",
    description: "Return configured IoT sensors from app configuration.",
  },
  async () => {
    const sensors = await IOT.getSensors();
    return {
      content: [{ type: "text", text: "Returned sensors" }],
      structuredContent: sensors,
    };
  }
);

// get_channels
mcpServer.registerTool(
  "get_channels",
  {
    title: "List channels",
    description: "Return configured IoT data channels (temp, CO₂, etc.).",
  },
  async () => {
    const channels = await IOT.getChannels();
    return {
      content: [{ type: "text", text: "Returned channels" }],
      structuredContent: channels,
    };
  }
);

// get_samples
mcpServer.registerTool(
  "get_samples",
  {
    title: "Generate mocked samples",
    description: "Generate mocked sensor samples for a time range and optional resolution.",
    inputSchema: {
      start: z
        .string()
        .describe("Start ISO date, e.g. 2022-01-01T00:00:00.000Z"),
      end: z
        .string()
        .describe("End ISO date, e.g. 2022-01-02T00:00:00.000Z"),
      resolution: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Number of samples to generate (optional)."),
    },
  },
  async ({ start, end, resolution }) => {
    const result = await IOT.getSamples(
      { start: new Date(start), end: new Date(end) },
      resolution
    );
    return {
      content: [
        {
          type: "text",
          text: `Generated ${result.count} samples from ${start} to ${end}`,
        },
      ],
      structuredContent: result,
    };
  }
);

// get_client_config (safe subset)
mcpServer.registerTool(
  "get_client_config",
  {
    title: "Get client configuration",
    description:
      "Return the client-safe configuration used by the web app (no secrets).",
    outputSchema: {},
  },
  async () => {
    const clientConfig = {
      aps: {
        model: CONFIG.aps.model,
        secondaryModel: CONFIG.aps.secondaryModel,
      },
      dataVisualization: CONFIG.dataVisualization,
      calibration: CONFIG.calibration,
      sprites: CONFIG.sprites,
      extensions: CONFIG.extensions,
      ui: CONFIG.ui,
    };
    return {
      content: [{ type: "text", text: "Returned client configuration" }],
      structuredContent: clientConfig,
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  // Important: log to stderr to keep stdout clean for protocol
  console.error("MCP server (aps-intc-data-viz) is running on stdio...");
}

main().catch((err) => {
  console.error("MCP server failed to start:", err);
  process.exit(1);
});


