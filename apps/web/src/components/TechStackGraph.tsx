"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../../packages/store/store";
import * as d3 from "d3";

interface LanguageData {
  name: string;
  bytes: number;
  percentage: number;
  color: string;
}

const TechStackGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageData | null>(
    null
  );
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isClient, setIsClient] = useState(false);
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );
  const [viewMode, setViewMode] = useState<"donut" | "bar" | "bubble">("donut");

  const repoData = useSelector((state: RootState) => state.repo.repoData);

  // Generate color for unknown languages
  const generateColor = (name: string): string => {
    const rainbowColors = [
      "#FF0000", // Pure Red
      "#FF4500", // Orange Red
      "#FF8C00", // Dark Orange
      "#FFD700", // Gold
      "#FFFF00", // Yellow
      "#ADFF2F", // Green Yellow
      "#00FF00", // Lime
      "#00FF7F", // Spring Green
      "#00FFFF", // Cyan
      "#00BFFF", // Deep Sky Blue
      "#0000FF", // Blue
      "#4169E1", // Royal Blue
      "#8A2BE2", // Blue Violet
      "#9400D3", // Violet
      "#FF00FF", // Magenta
      "#FF1493", // Deep Pink
      "#FF69B4", // Hot Pink
      "#FFA500", // Orange
      "#32CD32", // Lime Green
      "#20B2AA", // Light Sea Green
      "#87CEEB", // Sky Blue
      "#DDA0DD", // Plum
      "#F0E68C", // Khaki
      "#FA8072", // Salmon
      "#98FB98", // Pale Green
      "#87CEFA", // Light Sky Blue
      "#DDA0DD", // Plum
      "#F5DEB3", // Wheat
      "#FFB6C1", // Light Pink
      "#B0E0E6", // Powder Blue
      "#FFFFE0", // Light Yellow
      "#E0FFFF", // Light Cyan
      "#F0FFF0", // Honeydew
      "#FFF8DC", // Cornsilk
      "#FFEFD5", // Papaya Whip
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash = hash & hash;
    }

    return rainbowColors[Math.abs(hash) % rainbowColors.length];
  };

  // Rainbow spectrum - vibrant colors across all hues
  const languageColors: Record<string, string> = {
    JavaScript: "#FFD700", // Bright Gold
    TypeScript: "#FF1493", // Deep Pink
    Python: "#32CD32", // Lime Green
    Java: "#FF4500", // Orange Red
    "C++": "#8A2BE2", // Blue Violet
    C: "#708090", // Slate Gray
    "C#": "#00FF7F", // Spring Green
    PHP: "#FF69B4", // Hot Pink
    Ruby: "#DC143C", // Crimson
    Go: "#00CED1", // Dark Turquoise
    Rust: "#D2691E", // Chocolate
    Swift: "#FF6347", // Tomato
    Kotlin: "#9370DB", // Medium Purple
    Dart: "#4169E1", // Royal Blue
    HTML: "#FF8C00", // Dark Orange
    CSS: "#1E90FF", // Dodger Blue
    SCSS: "#DA70D6", // Orchid
    Vue: "#228B22", // Forest Green
    React: "#00FFFF", // Cyan
    Angular: "#B22222", // Fire Brick
    Shell: "#ADFF2F", // Green Yellow
    PowerShell: "#4682B4", // Steel Blue
    Dockerfile: "#20B2AA", // Light Sea Green
    YAML: "#CD5C5C", // Indian Red
    JSON: "#2F4F4F", // Dark Slate Gray
    XML: "#6495ED", // Cornflower Blue
    Markdown: "#191970", // Midnight Blue
    Svelte: "#FF7F50", // Coral
    Lua: "#483D8B", // Dark Slate Blue
    R: "#87CEEB", // Sky Blue
    Scala: "#A0522D", // Sienna
    Perl: "#800080", // Purple
    Haskell: "#DDA0DD", // Plum
    Elixir: "#BA55D3", // Medium Orchid
    Clojure: "#5F9EA0", // Cadet Blue
    Erlang: "#FF1493", // Deep Pink
    "Objective-C": "#87CEFA", // Light Sky Blue
    Assembly: "#8B4513", // Saddle Brown
    Vim: "#006400", // Dark Green
    Makefile: "#9ACD32", // Yellow Green
    CMake: "#4B0082", // Indigo
    Jupyter: "#FF8C00", // Dark Orange
    // More vibrant spectrum colors
    Solidity: "#696969", // Dim Gray
    WebAssembly: "#9932CC", // Dark Orchid
    GraphQL: "#FF00FF", // Magenta
    Sass: "#FF1493", // Deep Pink
    Less: "#000080", // Navy
    Stylus: "#FF6347", // Tomato
    CoffeeScript: "#8B4513", // Saddle Brown
    Elm: "#40E0D0", // Turquoise
    PureScript: "#2F4F4F", // Dark Slate Gray
    ReasonML: "#FF4500", // Orange Red
    OCaml: "#00FF00", // Lime
    "F#": "#8B008B", // Dark Magenta
    Nim: "#FFFF00", // Yellow
    Crystal: "#000000", // Black
    Zig: "#FFA500", // Orange
    // Additional rainbow colors
    Gleam: "#FF69B4", // Hot Pink
    Roc: "#7FFF00", // Chartreuse
    Nix: "#9400D3", // Violet
    Awk: "#FFD700", // Gold
    Tcl: "#FF6347", // Tomato
    Fortran: "#8A2BE2", // Blue Violet
    COBOL: "#DC143C", // Crimson
    Ada: "#00FF7F", // Spring Green
    Pascal: "#FF1493", // Deep Pink
    Delphi: "#FF4500", // Orange Red
  };

  // Ensure component only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle window resize
  useEffect(() => {
    if (!isClient) return;

    const handleResize = () => {
      if (!svgRef.current) return;

      const width = window.innerWidth;
      const newScreenSize =
        width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
      const sidebarWidth = newScreenSize === "mobile" ? 0 : 256;

      setScreenSize(newScreenSize);
      setDimensions({
        width: width - sidebarWidth,
        height: window.innerHeight - 100,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isClient]);

  // Process language data
  const processLanguageData = (): LanguageData[] => {
    if (!repoData.length || !repoData[0].language) return [];

    const languages = repoData[0].language;
    const totalBytes = Object.values(languages).reduce(
      (sum, bytes) => sum + bytes,
      0
    );

    return Object.entries(languages)
      .map(([name, bytes]) => ({
        name,
        bytes,
        percentage: (bytes / totalBytes) * 100,
        color: languageColors[name] || generateColor(name),
      }))
      .sort((a, b) => b.bytes - a.bytes);
  };

  const languageData = processLanguageData();

  // Debug logging
  React.useEffect(() => {
    const langCount = repoData[0]?.language
      ? Object.keys(repoData[0].language).length
      : 0;
    console.log("TechStack:", {
      repos: repoData.length,
      languages: langCount,
      data: languageData.length,
    });
  }, [repoData, languageData]);

  // Helper functions
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getResponsiveDimensions = () => {
    const baseWidth =
      screenSize === "mobile" ? 350 : screenSize === "tablet" ? 600 : 800;
    const baseHeight =
      screenSize === "mobile" ? 400 : screenSize === "tablet" ? 500 : 600;
    return {
      width: dimensions.width || baseWidth,
      height: dimensions.height || baseHeight,
      margin: screenSize === "mobile" ? 20 : screenSize === "tablet" ? 30 : 40,
    };
  };

  const shouldShowLabel = (percentage: number, arcAngle: number) => {
    const minPercentage =
      screenSize === "mobile" ? 5 : screenSize === "tablet" ? 4 : 3;
    const minAngle = screenSize === "mobile" ? 0.3 : 0.2;
    return percentage > minPercentage && arcAngle > minAngle;
  };

  // Render donut chart
  const renderDonutChart = () => {
    if (!svgRef.current || !languageData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height, margin } = getResponsiveDimensions();
    const radius = Math.min(width, height) / 2 - margin;

    svg.attr("width", width).attr("height", height);

    // Create gradients
    const defs = svg.append("defs");
    languageData.forEach((lang, i) => {
      const gradient = defs
        .append("radialGradient")
        .attr("id", `gradient-${i}`);
      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", lang.color);
      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr(
          "stop-color",
          d3.color(lang.color)?.darker(0.5)?.toString() || lang.color
        );
    });

    // Adjust vertical position for laptop screens
    const verticalOffset = screenSize === "desktop" ? -30 : 0;
    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width / 2}, ${height / 2 + verticalOffset})`
      );
    const pie = d3
      .pie<LanguageData>()
      .value((d) => d.bytes)
      .sort(null);
    const arc = d3
      .arc<d3.PieArcDatum<LanguageData>>()
      .innerRadius(radius * 0.4)
      .outerRadius(radius);

    const arcs = g
      .selectAll(".arc")
      .data(pie(languageData))
      .enter()
      .append("g")
      .attr("class", "arc")
      .style("cursor", "pointer")
      .on("click", (_, d) => setSelectedLanguage(d.data))
      .on("mouseover", function (_, d) {
        // Don't apply hover if this segment is already selected
        if (selectedLanguage && selectedLanguage.name === d.data.name) return;

        const hoverArc = d3
          .arc<d3.PieArcDatum<LanguageData>>()
          .innerRadius(radius * 0.35)
          .outerRadius(radius + 15);
        d3.select(this)
          .select("path")
          .transition()
          .duration(200)
          .attr("d", hoverArc as any);
      })
      .on("mouseout", function (_, d) {
        // Don't reset if this segment is selected
        if (selectedLanguage && selectedLanguage.name === d.data.name) return;

        d3.select(this)
          .select("path")
          .transition()
          .duration(200)
          .attr("d", arc as any);
      });

    // Create paths with initial selected state
    const selectedArc = d3
      .arc<d3.PieArcDatum<LanguageData>>()
      .innerRadius(radius * 0.35)
      .outerRadius(radius + 15);

    arcs
      .append("path")
      .attr("d", (d) => {
        // Use extended arc if this segment is selected
        return selectedLanguage && selectedLanguage.name === d.data.name
          ? (selectedArc(d) as any)
          : (arc(d) as any);
      })
      .attr("fill", (_, i) => `url(#gradient-${i})`)
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 1)
      .style("opacity", 0)
      .transition()
      .duration(800)
      .delay((_, i) => i * 100)
      .style("opacity", 1);

    // No background circles - clean text labels only

    // Add labels based on screen size
    if (screenSize === "mobile") {
      // Mobile: Language name + percentage (compact)
      arcs
        .append("text")
        .attr("transform", (d) => {
          const centroid = arc.centroid(d);
          return `translate(${centroid[0] * 1.1}, ${centroid[1] * 1.1 - 3})`;
        })
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "7px")
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .style("pointer-events", "none")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)")
        .text((d) => {
          if (!shouldShowLabel(d.data.percentage, d.endAngle - d.startAngle))
            return "";
          const name =
            d.data.name.length > 6
              ? d.data.name.substring(0, 6) + "..."
              : d.data.name;
          return name;
        })
        .style("opacity", 0)
        .transition()
        .duration(800)
        .delay((_, i) => i * 100 + 400)
        .style("opacity", 1);

      // Mobile: Percentage below language name
      arcs
        .append("text")
        .attr("transform", (d) => {
          const centroid = arc.centroid(d);
          return `translate(${centroid[0] * 1.1}, ${centroid[1] * 1.1 + 5})`;
        })
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "7px")
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .style("pointer-events", "none")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)")
        .text((d) =>
          shouldShowLabel(d.data.percentage, d.endAngle - d.startAngle)
            ? `${d.data.percentage.toFixed(1)}%`
            : ""
        )
        .style("opacity", 0)
        .transition()
        .duration(800)
        .delay((_, i) => i * 100 + 450)
        .style("opacity", 1);
    } else {
      // Tablet and Desktop: Language name + percentage
      const fontSize = screenSize === "tablet" ? "9px" : "11px";

      arcs
        .append("text")
        .attr("transform", (d) => {
          const centroid = arc.centroid(d);
          return `translate(${centroid[0]}, ${centroid[1] - 5})`;
        })
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", fontSize)
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .style("pointer-events", "none")
        .text((d) => {
          if (!shouldShowLabel(d.data.percentage, d.endAngle - d.startAngle))
            return "";
          const maxLength = screenSize === "tablet" ? 8 : 12;
          const name =
            d.data.name.length > maxLength
              ? d.data.name.substring(0, maxLength) + "..."
              : d.data.name;
          return name;
        })
        .style("opacity", 0)
        .transition()
        .duration(800)
        .delay((_, i) => i * 100 + 400)
        .style("opacity", 1);

      // Add percentage below language name
      arcs
        .append("text")
        .attr("transform", (d) => {
          const centroid = arc.centroid(d);
          return `translate(${centroid[0]}, ${centroid[1] + 8})`;
        })
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", screenSize === "tablet" ? "8px" : "10px")
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .style("pointer-events", "none")
        .text((d) =>
          shouldShowLabel(d.data.percentage, d.endAngle - d.startAngle)
            ? `${d.data.percentage.toFixed(1)}%`
            : ""
        )
        .style("opacity", 0)
        .transition()
        .duration(800)
        .delay((_, i) => i * 100 + 450)
        .style("opacity", 1);
    }
  };

  // Render bar chart
  const renderBarChart = () => {
    if (!svgRef.current || !languageData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = getResponsiveDimensions();
    const margin =
      screenSize === "mobile"
        ? { top: 10, right: 20, bottom: 20, left: 80 }
        : screenSize === "tablet"
          ? { top: 15, right: 25, bottom: 30, left: 90 }
          : { top: 20, right: 30, bottom: 40, left: 100 };

    svg.attr("width", width).attr("height", height);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(languageData, (d) => d.percentage) || 0])
      .range([0, chartWidth]);

    const yScale = d3
      .scaleBand()
      .domain(languageData.map((d) => d.name))
      .range([0, chartHeight])
      .padding(0.1);

    // Add bars with animation
    g.selectAll(".bar")
      .data(languageData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", (d) => yScale(d.name) || 0)
      .attr("width", 0)
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => d.color)
      .style("cursor", "pointer")
      .on("click", (_, d) => setSelectedLanguage(d))
      .on("mouseover", function () {
        d3.select(this).attr("opacity", 0.8);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
      })
      .transition()
      .duration(1000)
      .delay((_, i) => i * 100)
      .attr("width", (d) => xScale(d.percentage));

    // Add responsive y-axis labels
    g.selectAll(".label")
      .data(languageData)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", -10)
      .attr("y", (d) => (yScale(d.name) || 0) + yScale.bandwidth() / 2)
      .attr("text-anchor", "end")
      .attr("alignment-baseline", "middle")
      .attr("fill", "#e5e7eb")
      .attr(
        "font-size",
        screenSize === "mobile"
          ? "9px"
          : screenSize === "tablet"
            ? "10px"
            : "12px"
      )
      .text((d) => {
        const maxLength =
          screenSize === "mobile" ? 8 : screenSize === "tablet" ? 12 : 20;
        return d.name.length > maxLength
          ? d.name.substring(0, maxLength) + "..."
          : d.name;
      });

    // Add responsive percentage labels on bars
    g.selectAll(".percentage")
      .data(languageData)
      .enter()
      .append("text")
      .attr("class", "percentage")
      .attr(
        "x",
        (d) => xScale(d.percentage) + (screenSize === "mobile" ? 3 : 5)
      )
      .attr("y", (d) => (yScale(d.name) || 0) + yScale.bandwidth() / 2)
      .attr("alignment-baseline", "middle")
      .attr("fill", "#e5e7eb")
      .attr(
        "font-size",
        screenSize === "mobile"
          ? "9px"
          : screenSize === "tablet"
            ? "10px"
            : "12px"
      )
      .text((d) => `${d.percentage.toFixed(1)}%`);
  };

  // Render responsive bubble chart
  const renderBubbleChart = () => {
    if (!svgRef.current || !languageData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width =
      dimensions.width ||
      (screenSize === "mobile" ? 350 : screenSize === "tablet" ? 600 : 800);
    const height =
      dimensions.height ||
      (screenSize === "mobile" ? 400 : screenSize === "tablet" ? 500 : 600);
    const padding =
      screenSize === "mobile" ? 20 : screenSize === "tablet" ? 30 : 40;

    svg.attr("width", width).attr("height", height);

    const pack = d3
      .pack<LanguageData>()
      .size([width - padding, height - padding])
      .padding(screenSize === "mobile" ? 3 : screenSize === "tablet" ? 4 : 5);

    const root = d3
      .hierarchy<LanguageData>({ children: languageData } as any)
      .sum((d) => d?.bytes || 0);

    pack(root);

    const nodes = svg
      .selectAll(".node")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr(
        "transform",
        (d: any) =>
          `translate(${(d.x || 0) + padding / 2}, ${(d.y || 0) + padding / 2})`
      )
      .style("cursor", "pointer")
      .on("click", (_, d: any) => setSelectedLanguage(d.data!))
      .on("mouseover", function () {
        d3.select(this).select("circle").attr("opacity", 0.8);
      })
      .on("mouseout", function () {
        d3.select(this).select("circle").attr("opacity", 1);
      });

    nodes
      .append("circle")
      .attr("r", 0)
      .attr("fill", (d: any) => d.data!.color)
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 2)
      .transition()
      .duration(800)
      .delay((_, i) => i * 150)
      .attr("r", (d: any) => d.r || 0);

    nodes
      .append("text")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr(
        "font-size",
        (d: any) =>
          Math.min((d.r || 0) / 3, screenSize === "mobile" ? 10 : 14) + "px"
      )
      .text((d: any) => {
        const radius = d.r || 0;
        const minRadius = screenSize === "mobile" ? 15 : 20;
        return radius > minRadius ? d.data!.name : "";
      });
  };

  useEffect(() => {
    if (!isClient || !languageData.length) return;

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      switch (viewMode) {
        case "donut":
          renderDonutChart();
          break;
        case "bar":
          renderBarChart();
          break;
        case "bubble":
          renderBubbleChart();
          break;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isClient, languageData, dimensions, viewMode, screenSize]);

  // Keep selected segment extended
  useEffect(() => {
    if (!isClient || !languageData.length || viewMode !== "donut") return;

    const svg = d3.select(svgRef.current);
    const arcs = svg.selectAll(".arc");

    if (!arcs.empty()) {
      const { width, height, margin } = getResponsiveDimensions();
      const radius = Math.min(width, height) / 2 - margin;

      const normalArc = d3
        .arc<d3.PieArcDatum<LanguageData>>()
        .innerRadius(radius * 0.4)
        .outerRadius(radius);

      const selectedArc = d3
        .arc<d3.PieArcDatum<LanguageData>>()
        .innerRadius(radius * 0.35)
        .outerRadius(radius + 15);

      arcs
        .selectAll("path")
        .transition()
        .duration(300)
        .attr("d", (d: any) =>
          selectedLanguage && selectedLanguage.name === d.data.name
            ? (selectedArc(d) as any)
            : (normalArc(d) as any)
        );
    }
  }, [selectedLanguage, isClient, languageData.length, viewMode, dimensions]);

  if (!isClient) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading tech stack...</div>
        </div>
      </div>
    );
  }

  if (!languageData.length) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">📊</div>
          <div className="text-gray-400 mb-2 text-xl">
            No language data available
          </div>
          <div className="text-gray-500 max-w-md">
            Please analyze a repository first to see its tech stack. Make sure
            the repository has been successfully loaded in the system.
          </div>
          <div className="text-gray-600 text-sm">
            Debug: {repoData.length} repositories loaded,{" "}
            {repoData[0]?.language
              ? Object.keys(repoData[0].language).length
              : 0}{" "}
            languages detected
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* header  */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center p-2 sm:p-3 md:p-4 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 space-y-2 lg:space-y-0">
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 text-center sm:text-left">
            Tech Stack Analysis
          </h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-2 md:gap-4 text-xs sm:text-sm">
            <span className="text-gray-300 bg-slate-600/30 px-2 py-1 rounded text-center">
              {languageData.length} languages
            </span>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <span className="text-gray-300 bg-slate-600/30 px-2 py-1 rounded text-center">
              {formatBytes(
                languageData.reduce((sum, lang) => sum + lang.bytes, 0)
              )}{" "}
              total
            </span>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <span className="text-gray-300 bg-slate-600/30 px-2 py-1 rounded text-center">
              Primary: {languageData[0]?.name || "N/A"}
            </span>
          </div>
        </div>
        {/* viewmode selector */}
        <div className="flex flex-wrap justify-center sm:justify-end gap-1 sm:gap-2 w-full sm:w-auto">
          {(["donut", "bar", "bubble"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                viewMode === mode
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Main content area */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1">
          <svg ref={svgRef} className="w-full h-full bg-slate-900" />
        </div>

        {/* Mobile floating panel */}
        {selectedLanguage && screenSize === "mobile" && (
          <div className="absolute bottom-4 left-4 right-4 z-10 bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg p-4 shadow-2xl border border-slate-600 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">
                Language Details
              </h3>
              <button
                onClick={() => setSelectedLanguage(null)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-2 bg-slate-600/50 rounded-lg">
                <div
                  className="w-6 h-6 rounded-full shadow-lg"
                  style={{
                    backgroundColor: selectedLanguage.color,
                    boxShadow: `0 0 15px ${selectedLanguage.color}40`,
                  }}
                />
                <span className="text-lg font-bold text-white">
                  {selectedLanguage.name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-600/30 p-2 rounded">
                  <span className="text-gray-300 block">Percentage</span>
                  <span className="text-white font-mono">
                    {selectedLanguage.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="bg-slate-600/30 p-2 rounded">
                  <span className="text-gray-300 block">Size</span>
                  <span className="text-white font-mono">
                    {formatBytes(selectedLanguage.bytes)}
                  </span>
                </div>
                <div className="bg-slate-600/30 p-2 rounded">
                  <span className="text-gray-300 block">Lines</span>
                  <span className="text-white font-mono">
                    {Math.round(selectedLanguage.bytes / 25).toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-600/30 p-2 rounded">
                  <span className="text-gray-300 block">Rank</span>
                  <span className="text-white font-mono">
                    #
                    {languageData.findIndex(
                      (lang) => lang.name === selectedLanguage.name
                    ) + 1}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tablet and Desktop side panel */}
        {selectedLanguage && screenSize !== "mobile" && (
          <div
            className={`${
              screenSize === "tablet" ? "w-64" : "w-80"
            } bg-gradient-to-b from-slate-700 to-slate-800 p-4 sm:p-6 border-l border-slate-600 overflow-y-auto shadow-2xl`}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3
                className={`${
                  screenSize === "tablet" ? "text-base" : "text-lg"
                } font-semibold text-white`}
              >
                Language Details
              </h3>
              <button
                onClick={() => setSelectedLanguage(null)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-3 p-3 bg-slate-600/50 rounded-lg">
                <div
                  className={`${
                    screenSize === "tablet" ? "w-6 h-6" : "w-8 h-8"
                  } rounded-full shadow-lg`}
                  style={{
                    backgroundColor: selectedLanguage.color,
                    boxShadow: `0 0 20px ${selectedLanguage.color}40`,
                  }}
                />
                <span
                  className={`${
                    screenSize === "tablet" ? "text-lg" : "text-xl"
                  } font-bold text-white`}
                >
                  {selectedLanguage.name}
                </span>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="bg-slate-600/30 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 text-sm">Percentage</span>
                    <span
                      className={`text-white font-mono ${
                        screenSize === "tablet" ? "text-base" : "text-lg"
                      }`}
                    >
                      {selectedLanguage.percentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${selectedLanguage.percentage}%`,
                        backgroundColor: selectedLanguage.color,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-slate-600/30 p-3 rounded-lg">
                    <span className="text-gray-300 text-sm block">
                      File Size
                    </span>
                    <span
                      className={`text-white font-mono ${
                        screenSize === "tablet" ? "text-base" : "text-lg"
                      }`}
                    >
                      {formatBytes(selectedLanguage.bytes)}
                    </span>
                  </div>

                  <div className="bg-slate-600/30 p-3 rounded-lg">
                    <span className="text-gray-300 text-sm block">
                      Estimated Lines
                    </span>
                    <span
                      className={`text-white font-mono ${
                        screenSize === "tablet" ? "text-base" : "text-lg"
                      }`}
                    >
                      {Math.round(selectedLanguage.bytes / 25).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-600/30 p-3 rounded-lg">
                    <span className="text-gray-300 text-sm block">Rank</span>
                    <span
                      className={`text-white font-mono ${
                        screenSize === "tablet" ? "text-base" : "text-lg"
                      }`}
                    >
                      #
                      {languageData.findIndex(
                        (lang) => lang.name === selectedLanguage.name
                      ) + 1}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Responsive Legend */}
      <div className="p-2 sm:p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
          {languageData
            .slice(0, screenSize === "mobile" ? 6 : 8)
            .map((lang) => (
              <div
                key={lang.name}
                className="flex items-center space-x-1 sm:space-x-2"
              >
                <div
                  className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                  style={{ backgroundColor: lang.color }}
                />
                <span className="text-gray-300 text-xs sm:text-sm truncate max-w-20 sm:max-w-none">
                  {lang.name}
                </span>
                <span className="text-gray-500 text-xs">
                  {lang.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          {languageData.length > (screenSize === "mobile" ? 6 : 8) && (
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className="text-gray-400 text-xs sm:text-sm">
                +{languageData.length - (screenSize === "mobile" ? 6 : 8)} more
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechStackGraph;
