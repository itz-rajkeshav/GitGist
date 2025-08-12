"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../../packages/store/store";
import * as d3 from "d3";

interface TreeNode {
  name: string;
  path: string;
  type: "blob" | "tree" | "commit";
  size?: number;
  children?: TreeNode[];
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

const FolderStructureGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isClient, setIsClient] = useState(false);
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );
  const folderStructure = useSelector(
    (state: RootState) => state.repo.folderstructure
  );

  // Ensure component only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Transform flat folder structure to hierarchical tree
  const buildTree = (items: any[]): TreeNode => {
    const root: TreeNode = {
      name: "📁 Repository Root",
      path: "",
      type: "tree",
      children: [],
    };

    items.forEach((item) => {
      const pathParts = item.path
        .split("/")
        .filter((part: string) => part !== "");
      let currentNode = root;

      pathParts.forEach((part: string, index: number) => {
        if (!currentNode.children) {
          currentNode.children = [];
        }

        let childNode = currentNode.children.find(
          (child) => child.name === part
        );

        if (!childNode) {
          const isLastPart = index === pathParts.length - 1;
          childNode = {
            name: part,
            path: pathParts.slice(0, index + 1).join("/"),
            type: isLastPart ? item.type : "tree",
            size: isLastPart ? item.size : undefined,
            children: isLastPart && item.type === "blob" ? undefined : [],
          };
          currentNode.children.push(childNode);
        }

        currentNode = childNode;
      });
    });

    return root;
  };

  // Handle window resize (client-side only)
  useEffect(() => {
    if (!isClient) return;

    const handleResize = () => {
      if (svgRef.current && typeof window !== "undefined") {
        const containerRect = svgRef.current.getBoundingClientRect();
        const windowWidth = window.innerWidth;

        // Determine screen size
        let currentScreenSize: "mobile" | "tablet" | "desktop" = "desktop";
        if (windowWidth < 640) {
          currentScreenSize = "mobile";
        } else if (windowWidth < 1024) {
          currentScreenSize = "tablet";
        }

        setScreenSize(currentScreenSize);

        // Calculate sidebar offset based on screen size
        const sidebarWidth = currentScreenSize === "mobile" ? 0 : 256;

        setDimensions({
          width: containerRect.width || windowWidth - sidebarWidth,
          height: containerRect.height || window.innerHeight - 100,
        });
      }
    };

    handleResize(); // Initial size
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isClient]);

  // Close node details when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedNode && svgRef.current) {
        const target = event.target as Element;
        // Close if clicking outside the details panel and not on a node
        if (
          !target.closest(".node-details-panel") &&
          !target.closest("circle")
        ) {
          setSelectedNode(null);
        }
      }
    };

    if (selectedNode) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [selectedNode]);

  useEffect(() => {
    if (!isClient || !folderStructure.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Get responsive dimensions and margins
    const containerRect = svgRef.current.getBoundingClientRect();
    const width = dimensions.width || containerRect.width || window.innerWidth;
    const height =
      dimensions.height || containerRect.height || window.innerHeight;

    // Responsive margins optimized for all screen sizes
    const getResponsiveMargins = () => {
      switch (screenSize) {
        case "mobile":
          return { top: 15, right: 15, bottom: 15, left: 15 }; // Minimal margins for max space
        case "tablet":
          return { top: 25, right: 80, bottom: 25, left: 40 }; // Balanced margins
        default:
          return { top: 40, right: 200, bottom: 40, left: 100 }; // Original desktop margins
      }
    };

    const margin = getResponsiveMargins();

    svg.attr("width", width).attr("height", height);

    const container = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Build tree structure
    const treeData = buildTree(folderStructure);

    // Create D3 hierarchy
    const root = d3.hierarchy(treeData);

    // Responsive tree layout sizing for better visibility
    const getTreeSize = () => {
      const baseHeight = height - margin.top - margin.bottom;
      const baseWidth = width - margin.left - margin.right;

      switch (screenSize) {
        case "mobile":
          // Much more vertical spacing between nodes for clearer lines
          return [baseHeight * 2.0, baseWidth * 1.2];
        case "tablet":
          // Increased vertical spacing for better line visibility
          return [baseHeight * 1.6, baseWidth * 1.1];
        default:
          // Slightly more spacing even for desktop
          return [baseHeight * 1.2, baseWidth];
      }
    };

    const [treeHeight, treeWidth] = getTreeSize();
    const treeLayout = d3
      .tree<TreeNode>()
      .size([treeHeight, treeWidth])
      .separation((a, b) => {
        // Increase separation between nodes for clearer lines
        const baseSeparation = a.parent === b.parent ? 1 : 2;
        switch (screenSize) {
          case "mobile":
            return baseSeparation * 1.8; // Much more space on mobile
          case "tablet":
            return baseSeparation * 1.4; // More space on tablet
          default:
            return baseSeparation * 1.2; // Slightly more space on desktop
        }
      });

    treeLayout(root);

    // Create links (horizontal layout)
    container
      .selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr(
        "d",
        d3
          .linkHorizontal<any, TreeNode>()
          .x((d) => d.y!)
          .y((d) => d.x!)
      )
      .attr("fill", "none")
      .attr("stroke", "#64748b")
      .attr("stroke-width", 2)
      .attr("opacity", 0.6);

    // Create nodes
    const nodes = container
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .style("cursor", "pointer")
      .on("click", (_, d) => {
        setSelectedNode(d.data);
      });

    // Responsive node sizing
    const getNodeSize = (d: any) => {
      // Only scale down for mobile and tablet, keep desktop at original size
      const baseSize =
        screenSize === "mobile" ? 0.7 : screenSize === "tablet" ? 0.85 : 1;

      if (d.data.name === "📁 Repository Root") {
        return screenSize === "desktop" ? 12 : Math.round(12 * baseSize); // Original desktop size
      }
      if (d.data.type === "tree") {
        return screenSize === "desktop" ? 8 : Math.round(8 * baseSize); // Original desktop size
      }
      return screenSize === "desktop"
        ? Math.max(4, Math.min(10, (d.data.size || 0) / 1000)) // Original desktop sizing
        : Math.max(
            3,
            Math.min(Math.round(10 * baseSize), (d.data.size || 0) / 1000)
          );
    };

    // Add circles for nodes
    nodes
      .append("circle")
      .attr("r", getNodeSize)
      .attr("fill", (d) => {
        // Special color for root
        if (d.data.name === "📁 Repository Root") return "#f59e0b";
        switch (d.data.type) {
          case "tree":
            return "#3b82f6"; // Blue for folders
          case "blob":
            return "#10b981"; // Green for files
          default:
            return "#6b7280"; // Gray for others
        }
      })
      .attr("stroke", (d) => {
        return d.data.name === "📁 Repository Root" ? "#fbbf24" : "#1f2937";
      })
      .attr("stroke-width", (d) => {
        return d.data.name === "📁 Repository Root" ? 3 : 2;
      })
      .on("mouseover", function (_, d) {
        const hoverSize = getNodeSize(d) * 1.4; // 40% larger on hover
        d3.select(this).transition().duration(200).attr("r", hoverSize);
      })
      .on("mouseout", function (_, d) {
        d3.select(this).transition().duration(200).attr("r", getNodeSize(d));
      });

    // Responsive text sizing and positioning
    const getTextSize = () => {
      switch (screenSize) {
        case "mobile":
          return "10px";
        case "tablet":
          return "11px";
        default:
          return "12px"; // Keep original desktop size
      }
    };

    const getTextOffset = () => {
      switch (screenSize) {
        case "mobile":
          return 12; // Slightly more space for mobile
        case "tablet":
          return 14; // Moderate spacing for tablet
        default:
          return 15; // Original desktop offset
      }
    };

    // Add labels (horizontal layout)
    nodes
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", getTextOffset())
      .attr("text-anchor", "start")
      .text((d) => {
        // Show only the last part of the name (after last "/")
        const name = d.data.name;
        let displayName = name.includes("/")
          ? name.split("/").pop() || name
          : name;

        // Adjusted truncation limits for better visibility with wider spacing
        if (screenSize === "mobile" && displayName.length > 15) {
          displayName = displayName.substring(0, 15) + "...";
        } else if (screenSize === "tablet" && displayName.length > 20) {
          displayName = displayName.substring(0, 20) + "...";
        }
        // Desktop: no truncation, show full names

        return displayName;
      })
      .attr("font-size", getTextSize())
      .attr("fill", "#e5e7eb")
      .attr(
        "font-family",
        "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
      );

    // Add zoom behavior with responsive constraints
    const getZoomExtent = (): [number, number] => {
      switch (screenSize) {
        case "mobile":
          return [0.2, 2]; // More constrained zoom for mobile
        case "tablet":
          return [0.15, 2.5]; // Moderate zoom range for tablet
        default:
          return [0.1, 3]; // Full zoom range for desktop
      }
    };

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent(getZoomExtent())
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);
  }, [isClient, folderStructure, dimensions]);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading repository structure...</div>
        </div>
      </div>
    );
  }

  if (!folderStructure.length) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-2 text-xl">
            No repository data available
          </div>
          <div className="text-gray-500">
            Please analyze a repository first to see its structure
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Header with title and legend - optimized for all screens */}
      <div
        className={`bg-slate-800 border-b border-slate-700 ${
          screenSize === "mobile" ? "p-3" : "p-4"
        }`}
      >
        <div
          className={`flex items-center ${
            screenSize === "mobile" ? "flex-col space-y-2" : "justify-between"
          }`}
        >
          {/* Title */}
          <div>
            <h1
              className={`font-bold text-white ${
                screenSize === "mobile"
                  ? "text-lg text-center"
                  : screenSize === "tablet"
                    ? "text-xl"
                    : "text-2xl"
              }`}
            >
              Repository Structure
            </h1>
          </div>

          {/* Legend */}
          <div
            className={`flex items-center ${
              screenSize === "mobile"
                ? "space-x-3 text-xs"
                : screenSize === "tablet"
                  ? "space-x-4 text-xs"
                  : "space-x-6 text-sm"
            }`}
          >
            <div className="flex items-center space-x-1">
              <div
                className={`bg-amber-500 rounded-full ${
                  screenSize === "mobile" ? "w-2 h-2" : "w-3 h-3"
                }`}
              ></div>
              <span className="text-gray-300 font-medium">Root</span>
            </div>
            <div className="flex items-center space-x-1">
              <div
                className={`bg-blue-500 rounded-full ${
                  screenSize === "mobile" ? "w-2 h-2" : "w-3 h-3"
                }`}
              ></div>
              <span className="text-gray-300 font-medium">Folders</span>
            </div>
            <div className="flex items-center space-x-1">
              <div
                className={`bg-green-500 rounded-full ${
                  screenSize === "mobile" ? "w-2 h-2" : "w-3 h-3"
                }`}
              ></div>
              <span className="text-gray-300 font-medium">Files</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1">
          <svg ref={svgRef} className="w-full h-full bg-slate-900" />
        </div>

        {/* Mobile floating panel */}
        {selectedNode && screenSize === "mobile" && (
          <div className="absolute bottom-16 left-4 right-4 z-10 node-details-panel bg-slate-700 rounded-lg p-4 shadow-2xl border border-slate-600 max-h-64 overflow-y-auto">
            {/* Close button for mobile */}
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white p-1 text-lg"
            >
              ✕
            </button>

            <h3 className="font-semibold text-white mb-3 text-base pr-8">
              Node Details
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-gray-400">Name:</span>
                <span className="text-white ml-2 font-mono break-words">
                  {selectedNode.name}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Path:</span>
                <span className="text-white ml-2 font-mono break-all">
                  {selectedNode.path || "/"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Type:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    selectedNode.type === "tree"
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-green-500/20 text-green-300"
                  }`}
                >
                  {selectedNode.type === "tree" ? "Folder" : "File"}
                </span>
              </div>
              {selectedNode.size !== undefined && (
                <div>
                  <span className="text-gray-400">Size:</span>
                  <span className="text-white ml-2">
                    {selectedNode.size > 1024
                      ? `${(selectedNode.size / 1024).toFixed(1)} KB`
                      : `${selectedNode.size} bytes`}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-600 mt-3">
                <span className="text-gray-500 text-xs">
                  Tap anywhere outside to close
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tablet and Desktop side panel */}
        {selectedNode && screenSize !== "mobile" && (
          <div
            className={`
            node-details-panel
            ${screenSize === "tablet" ? "w-64 ml-2" : "w-80 ml-4"}
            max-h-96 overflow-y-auto bg-slate-700 rounded-l-2xl p-4 relative
          `}
          >
            <h3
              className={`font-semibold text-white mb-3 ${screenSize === "tablet" ? "text-base" : "text-lg"}`}
            >
              Node Details
            </h3>
            <div
              className={`space-y-2 ${screenSize === "tablet" ? "text-xs" : "text-sm"}`}
            >
              <div>
                <span className="text-gray-400">Name:</span>
                <span className="text-white ml-2 font-mono break-words">
                  {selectedNode.name}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Path:</span>
                <span className="text-white ml-2 font-mono break-all">
                  {selectedNode.path || "/"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Type:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    selectedNode.type === "tree"
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-green-500/20 text-green-300"
                  }`}
                >
                  {selectedNode.type === "tree" ? "Folder" : "File"}
                </span>
              </div>
              {selectedNode.size !== undefined && (
                <div>
                  <span className="text-gray-400">Size:</span>
                  <span className="text-white ml-2">
                    {selectedNode.size > 1024
                      ? `${(selectedNode.size / 1024).toFixed(1)} KB`
                      : `${selectedNode.size} bytes`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help text at bottom - optimized for all screens */}
      <div
        className={`bg-slate-800 border-t border-slate-700 text-gray-500 ${
          screenSize === "mobile" ? "p-2 text-xs" : "p-3 text-xs"
        }`}
      >
        {screenSize === "mobile" ? (
          <div className="text-center">
            <span>• Tap nodes • Pinch to zoom • Drag to pan</span>
          </div>
        ) : screenSize === "tablet" ? (
          <div className="text-center">
            <span>
              • Click/tap nodes for details • Scroll/pinch to zoom • Drag to pan
            </span>
          </div>
        ) : (
          <div className="flex justify-between">
            <span>
              • Click nodes for details • Scroll to zoom • Drag to pan
            </span>
            <span>• Root on left, expands right • Shows filenames only</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderStructureGraph;
