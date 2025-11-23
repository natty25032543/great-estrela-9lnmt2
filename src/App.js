import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Save,
  Upload,
  Loader,
  ZoomIn,
  ZoomOut,
  Type,
  Eraser,
  MousePointer2,
  Trash2,
  FileText,
  Eye,
  PenTool,
  X,
  Check,
  Image as ImageIcon,
  Move,
  PlusCircle,
  FilePlus,
  FileUp,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Maximize,
  XCircle,
  Menu,
  ImagePlus,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

const useScript = (url, onLoad) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = onLoad;
    document.body.appendChild(script);
    return () => {
      if (!url.includes("tailwindcss")) {
        document.body.removeChild(script);
      }
    };
  }, [url]);
};

const generateId = () => {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// --- 1. LOGO COMPONENT (ปรับขนาดให้เล็กลงอีกนิดเพื่อจอเล็ก) ---
const CorrectPDFLogo = () => {
  return (
    <div className="flex items-end gap-2 select-none cursor-default justify-center">
      <div className="relative flex items-center">
        <span
          className="text-[#1e65b6] font-bold text-2xl md:text-4xl tracking-tighter"
          style={{ fontFamily: "sans-serif" }}
        >
          c
        </span>
        <div className="w-5 h-5 md:w-8 md:h-8 border-[3px] md:border-[4px] border-[#1e65b6] rounded-full flex items-center justify-center mx-0.5 relative top-0.5">
          <Check
            strokeWidth={4}
            className="text-[#1e65b6] w-3 h-3 md:w-5 md:h-5"
          />
        </div>
        {/* ซ่อนข้อความยาวๆ เมื่อจอเล็กมากๆ */}
        <span
          className="text-[#1e65b6] font-bold text-2xl md:text-4xl tracking-tighter"
          style={{ fontFamily: "sans-serif" }}
        >
          rrect
        </span>
      </div>
      <div className="flex flex-col items-start -mb-1 ml-1 hidden sm:flex">
        <span
          className="text-[#333] font-bold text-xl tracking-widest leading-none"
          style={{ fontFamily: "sans-serif" }}
        >
          PDF
        </span>
        <div className="flex items-center">
          <div className="h-[3px] w-12 bg-[#dc2626] rounded-full"></div>
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[8px] border-t-[#dc2626] -rotate-45 transform origin-top -ml-1 mt-1"></div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  // --- 🔥 Auto Load Tailwind ---
  useScript("https://cdn.tailwindcss.com");

  const [viewMode, setViewMode] = useState("list");
  const [showSidebar, setShowSidebar] = useState(true);
  const [tool, setTool] = useState("cursor");
  const [fontName, setFontName] = useState("Sarabun");
  const [fontSize, setFontSize] = useState(16);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [textMode, setTextMode] = useState("transparent");

  const [showSigModal, setShowSigModal] = useState(false);
  const [isDrawingSig, setIsDrawingSig] = useState(false);
  const [dialog, setDialog] = useState({
    show: false,
    type: "alert",
    title: "",
    message: "",
    onConfirm: null,
  });

  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const mergeInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const sigCanvasRef = useRef(null);

  const [isImporting, setIsImporting] = useState(false);
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);
  const [importStatus, setImportStatus] = useState("");

  const [pages, setPages] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedPageIds, setSelectedPageIds] = useState(new Set());

  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1123;

  useScript(
    "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
  );
  useScript(
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        setPdfLibLoaded(true);
      }
    }
  );

  // Helpers
  const showAlert = (title, msg) =>
    setDialog({
      show: true,
      type: "alert",
      title,
      message: msg,
      onConfirm: null,
    });
  const showConfirm = (title, msg, callback) =>
    setDialog({
      show: true,
      type: "confirm",
      title,
      message: msg,
      onConfirm: callback,
    });
  const closeDialog = () => setDialog({ ...dialog, show: false });

  // Page Logic
  const createBlankPageImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = A4_WIDTH_PX;
    canvas.height = A4_HEIGHT_PX;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg");
  };

  const handleAddBlankPage = () => {
    const newPageId = generateId();
    const newPage = {
      id: newPageId,
      bgImage: createBlankPageImage(),
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      locked: false,
    };
    setPages((prev) => [...prev, newPage]);
    if (viewMode === "list")
      setTimeout(
        () =>
          document
            .getElementById(`page-view-${newPageId}`)
            ?.scrollIntoView({ behavior: "smooth" }),
        100
      );
  };

  const handleDeletePage = (pageId) => {
    const page = pages.find((p) => p.id === pageId);
    if (page?.locked) {
      showAlert("ล็อคอยู่", "กรุณาปลดล็อคก่อนลบ");
      return;
    }
    showConfirm(
      "ยืนยันการลบ",
      `ต้องการลบหน้า ${pages.findIndex((p) => p.id === pageId) + 1}?`,
      () => {
        setPages((prev) => prev.filter((p) => p.id !== pageId));
        setItems((prev) => prev.filter((i) => i.pageId !== pageId));
      }
    );
  };

  const handleDeleteSelectedPages = () => {
    if (selectedPageIds.size === 0) return;
    showConfirm(
      "ลบหลายหน้า",
      `ลบ ${selectedPageIds.size} หน้าที่เลือก?`,
      () => {
        setPages((prev) => prev.filter((p) => !selectedPageIds.has(p.id)));
        setItems((prev) => prev.filter((i) => !selectedPageIds.has(i.pageId)));
        setSelectedPageIds(new Set());
      }
    );
  };

  const toggleLockPage = (pageId) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, locked: !p.locked } : p))
    );
  };

  const unlockAllPages = () => {
    showConfirm("ปลดล็อค", "ปลดล็อคทุกหน้า?", () =>
      setPages((prev) => prev.map((p) => ({ ...p, locked: false })))
    );
  };

  const movePage = (index, direction) => {
    if (
      (direction === -1 && index === 0) ||
      (direction === 1 && index === pages.length - 1)
    )
      return;
    if (pages[index].locked) {
      showAlert("ย้ายไม่ได้", "หน้านี้ล็อคอยู่");
      return;
    }
    const newPages = [...pages];
    const targetIndex = index + direction;
    [newPages[index], newPages[targetIndex]] = [
      newPages[targetIndex],
      newPages[index],
    ];
    setPages(newPages);
  };

  const togglePageSelection = (pageId) => {
    const newSet = new Set(selectedPageIds);
    if (newSet.has(pageId)) newSet.delete(pageId);
    else newSet.add(pageId);
    setSelectedPageIds(newSet);
  };

  const selectAllPages = () => {
    setSelectedPageIds(
      selectedPageIds.size === pages.length
        ? new Set()
        : new Set(pages.map((p) => p.id))
    );
  };

  // PDF Processing
  const renderPageAsImage = async (page, scaleFactor) => {
    const viewport = page.getViewport({ scale: scaleFactor * 2.0 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL("image/jpeg", 0.9);
  };

  const processPdfFile = async (file, isAppend) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const newPages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        setImportStatus(`หน้า ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const scaleFactor = A4_WIDTH_PX / unscaledViewport.width;
        const viewport = page.getViewport({ scale: scaleFactor });
        const bgImage = await renderPageAsImage(page, scaleFactor);
        newPages.push({
          id: generateId(),
          bgImage,
          width: A4_WIDTH_PX,
          height: viewport.height,
          locked: false,
        });
      }
      setPages((prev) => (isAppend ? [...prev, ...newPages] : newPages));
      if (!isAppend) setZoomLevel(100);
    } catch (err) {
      showAlert("Error", err.message);
    } finally {
      setIsImporting(false);
      setImportStatus("");
    }
  };

  const handlePdfUpload = (e) => {
    if (e.target.files[0]) {
      setIsImporting(true);
      processPdfFile(e.target.files[0], false);
    }
  };
  const handlePdfMerge = (e) => {
    if (e.target.files[0]) {
      setIsImporting(true);
      processPdfFile(e.target.files[0], true);
    }
  };

  const handleImageUpload = (e) => {
    if (e.target.files[0] && pages.length > 0) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newItem = {
          id: generateId(),
          pageId: pages[0].id,
          type: "image",
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          content: ev.target.result,
        };
        setItems([...items, newItem]);
        setSelectedItemId(newItem.id);
        setTool("cursor");
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Item Interaction
  const handlePageClick = (e, pageId) => {
    const page = pages.find((p) => p.id === pageId);
    if (page?.locked) return;
    if (tool === "cursor") {
      if (e.target.className.includes("click-layer")) setSelectedItemId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    const newItem = {
      id: generateId(),
      pageId,
      type: tool,
      x,
      y,
      width: tool === "eraser" ? 100 : tool === "text" ? 200 : null,
      height: tool === "eraser" ? 24 : tool === "text" ? 50 : null,
      content: tool === "text" ? "ข้อความ" : "",
      fontSize,
      fontFamily: fontName,
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      backgroundColor:
        tool === "text" && textMode === "white" ? "white" : "transparent",
    };
    setItems([...items, newItem]);
    setSelectedItemId(newItem.id);
    setTool("cursor");
  };

  const updateItem = (id, props) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...props } : i)));
  const deleteItem = () => {
    if (selectedItemId) {
      setItems((prev) => prev.filter((i) => i.id !== selectedItemId));
      setSelectedItemId(null);
    }
  };

  const handleMoveMouseDown = (e, id, initialX, initialY) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const onMove = (ev) => {
      const scale = zoomLevel / 100;
      updateItem(id, {
        x: initialX + (ev.clientX - startX) / scale,
        y: initialY + (ev.clientY - startY) / scale,
      });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  const handleResizeMouseDown = (e, id, initialW, initialH) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const onMove = (ev) => {
      const scale = zoomLevel / 100;
      updateItem(id, {
        width: Math.max(20, initialW + (ev.clientX - startX) / scale),
        height: Math.max(20, initialH + (ev.clientY - startY) / scale),
      });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const exportToPDF = async () => {
    if (viewMode === "grid") {
      showAlert("เตือน", "กรุณากลับสู่มุมมองปกติ (List) เพื่อบันทึก");
      return;
    }
    setSelectedItemId(null);
    document.body.classList.add("printing");
    const opt = {
      margin: 0,
      filename: "CorrectPDF_Export.pdf",
      image: { type: "jpeg", quality: 1.0 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: "px", format: "a4", orientation: "portrait" },
    };
    if (window.html2pdf)
      await window.html2pdf().set(opt).from(editorRef.current).save();
    document.body.classList.remove("printing");
  };

  const getSelectedItem = () => items.find((i) => i.id === selectedItemId);

  // Signature
  const startDrawing = (e) => {
    setIsDrawingSig(true);
    const ctx = sigCanvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };
  const draw = (e) => {
    if (!isDrawingSig) return;
    const ctx = sigCanvasRef.current.getContext("2d");
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };
  const endDrawing = () => setIsDrawingSig(false);
  const clearSignature = () => {
    const ctx = sigCanvasRef.current.getContext("2d");
    ctx.clearRect(
      0,
      0,
      sigCanvasRef.current.width,
      sigCanvasRef.current.height
    );
  };
  const saveSignature = () => {
    const data = sigCanvasRef.current.toDataURL();
    if (pages.length > 0) {
      const newItem = {
        id: generateId(),
        pageId: pages[0].id,
        type: "image",
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        content: data,
      };
      setItems([...items, newItem]);
      setSelectedItemId(newItem.id);
    }
    setShowSigModal(false);
  };

  // 🔥 FIX: ปรับความกว้างกล่อง Upload ให้เป็น % (Responsive)
  return (
    <div className="flex flex-col h-screen bg-[#e9e9e9] font-sans overflow-hidden text-[#333]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Chakra+Petch:wght@400;700&family=Mali:wght@400;700&display=swap');
        .pdf-page-container { margin: 0 auto 40px auto; position: relative; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.2); overflow: hidden; }
        .pdf-bg-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; user-select: none; }
        .click-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; }
        .canvas-item { position: absolute; user-select: none; }
        .canvas-item.selected { outline: 1px dashed #3b82f6; z-index: 50; }
        .canvas-item.eraser { background-color: white; border: 1px dashed #ccc; opacity: 0.95; }
        .canvas-item.eraser.selected { border: 1px solid #3b82f6; }
        .text-area-input { background: transparent; border: none; outline: none; width: 100%; height: 100%; resize: none; overflow: hidden; line-height: 1.2; padding: 2px; box-sizing: border-box; }
        .move-handle { position: absolute; top: -24px; left: 0; background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px 4px 0 0; cursor: move; z-index: 60; display: flex; align-items: center; gap: 4px; font-size: 10px; }
        .resize-handle { position: absolute; bottom: -5px; right: -5px; width: 12px; height: 12px; background: #3b82f6; cursor: se-resize; border-radius: 50%; border: 2px solid white; z-index: 60; }
        
        .page-toolbar { width: 794px; max-width: 100%; margin: 0 auto; background: linear-gradient(to bottom, #f3f3f3, #e0e0e0); border-top: 1px solid #ccc; border-left: 1px solid #ccc; border-right: 1px solid #ccc; border-radius: 8px 8px 0 0; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 -2px 5px rgba(0,0,0,0.05); margin-top: 30px; }
        .pt-title { font-weight: bold; color: #444; font-size: 14px; text-shadow: 0 1px 0 white; white-space: nowrap; }
        .pt-btn { background: white; border: 1px solid #bbb; border-radius: 3px; padding: 3px 6px; font-size: 12px; color: #333; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); transition: all 0.1s; }
        .pt-btn:hover { background: #f8f8f8; border-color: #999; }
        .pt-btn.lock { font-weight: bold; }
        .pt-btn.delete { color: #d32f2f; font-weight: bold; border-color: #e57373; background: #fff0f0; }
        .divider-v { width: 1px; height: 20px; background: #ccc; margin: 0 6px; border-right: 1px solid #fff; }
        
        /* Grid Styles */
        .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; padding: 20px 0; }
        .grid-item { position: relative; background: white; border: 1px solid #ddd; border-radius: 8px; padding: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center; }
        .grid-item.selected { border: 2px solid #3b82f6; background: #eff6ff; }
        .grid-thumb { width: 100%; height: 200px; object-fit: contain; background: #eee; border: 1px solid #eee; }
        .grid-badge { position: absolute; top: -8px; left: -8px; background: #333; color: white; font-size: 12px; padding: 2px 8px; border-radius: 4px; z-index: 10; }
        .grid-controls { display: flex; gap: 4px; margin-top: 10px; justify-content: center; flex-wrap: wrap; }
        .grid-select-check { position: absolute; top: 10px; right: 10px; width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.8); border: 1px solid #ccc; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 20; }
        .grid-select-check.active { background: #3b82f6; border-color: #3b82f6; color: white; }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        body.printing .canvas-item { border: none !important; outline: none !important; }
        body.printing .move-handle, body.printing .resize-handle, body.printing .page-toolbar { display: none; }
        body.printing .pdf-page-container { margin: 0; box-shadow: none; }
    `}</style>

      {/* Header */}
      <div className="bg-white px-2 md:px-4 py-2 flex justify-between items-center shadow-md z-50 border-b border-gray-300 h-16 sticky top-0 shrink-0">
        <div className="shrink-0">
          <CorrectPDFLogo />
        </div>

        {viewMode === "list" && (
          <div className="flex flex-1 items-center justify-start md:justify-center gap-2 bg-[#f5f5f5] p-1 rounded border border-gray-300 mx-2 overflow-x-auto scrollbar-hide max-w-[60vw] md:max-w-none">
            <div className="flex items-center gap-1 min-w-max">
              <button
                onClick={() => setTool("cursor")}
                className={`p-2 rounded ${
                  tool === "cursor"
                    ? "bg-white shadow text-blue-600 border border-gray-200"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                title="แก้ไข"
              >
                <MousePointer2 size={18} />
              </button>
              <div className="w-[1px] h-6 bg-gray-300 mx-1"></div>
              <button
                onClick={() => setTool("text")}
                className={`p-2 rounded ${
                  tool === "text"
                    ? "bg-white shadow text-blue-600 border border-gray-200"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                title="เพิ่มข้อความ"
              >
                <Type size={18} />
              </button>
              <div className="flex bg-gray-200 rounded p-0.5 mx-1 border border-gray-300">
                <button
                  onClick={() => setTextMode("transparent")}
                  className={`px-2 py-1 text-[10px] md:text-xs rounded ${
                    textMode === "transparent"
                      ? "bg-white shadow text-black"
                      : "text-gray-500"
                  }`}
                >
                  พื้นใส
                </button>
                <button
                  onClick={() => setTextMode("white")}
                  className={`px-2 py-1 text-[10px] md:text-xs rounded ${
                    textMode === "white"
                      ? "bg-white shadow text-black"
                      : "text-gray-500"
                  }`}
                >
                  ทับ
                </button>
              </div>
              <div className="w-[1px] h-6 bg-gray-300 mx-1"></div>
              <button
                onClick={() => imageInputRef.current.click()}
                className="p-2 rounded hover:bg-gray-200 text-green-600"
                title="รูปภาพ"
              >
                <ImagePlus size={18} />
              </button>
              <input
                type="file"
                accept="image/*"
                ref={imageInputRef}
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                onClick={() => setTool("eraser")}
                className={`p-2 rounded ${
                  tool === "eraser"
                    ? "bg-white shadow text-black border border-gray-200"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                title="ลบคำผิด"
              >
                <Eraser size={18} />
              </button>
              <button
                onClick={() => setShowSigModal(true)}
                className="p-2 rounded hover:bg-gray-200 text-blue-600"
                title="เซ็นชื่อ"
              >
                <PenTool size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded text-sm font-bold transition ${
              viewMode === "grid"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
            }`}
          >
            {viewMode === "list" ? (
              <LayoutGrid size={16} />
            ) : (
              <List size={16} />
            )}
            <span className="hidden md:inline">
              {viewMode === "list" ? "มุมมอง" : "แก้ไข"}
            </span>
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-[#e23d31] hover:bg-[#c53025] text-white px-2 md:px-4 py-1.5 rounded text-xs font-bold shadow-lg transition-transform hover:scale-105 border border-[#b71c1c]"
          >
            <Save size={14} />{" "}
            <span className="hidden md:inline">บันทึก PDF</span>
          </button>
        </div>
      </div>

      {/* Toolbar (List Mode) */}
      {viewMode === "list" && (
        <div className="bg-[#f8f9fa] border-b border-gray-300 px-2 md:px-4 py-2 shadow-sm z-40 flex items-center gap-4 justify-between text-black h-12 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2 md:gap-4 min-w-max">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-1.5 rounded ${
                showSidebar ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200"
              }`}
            >
              <Menu size={18} />
            </button>
            <div className="flex gap-2 pr-4 border-r border-gray-300">
              <button
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-2 md:px-3 py-1.5 rounded hover:bg-blue-50 hover:text-blue-600 text-sm font-bold shadow-sm"
              >
                <Upload size={16} />{" "}
                <span className="hidden md:inline">เปิดไฟล์</span>
              </button>
              <input
                type="file"
                accept=".pdf"
                ref={fileInputRef}
                className="hidden"
                onChange={handlePdfUpload}
              />
              <button
                onClick={() => mergeInputRef.current.click()}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-2 md:px-3 py-1.5 rounded hover:bg-green-50 hover:text-green-600 text-sm font-bold shadow-sm"
              >
                <FileUp size={16} />{" "}
                <span className="hidden md:inline">แทรก</span>
              </button>
              <input
                type="file"
                accept=".pdf"
                ref={mergeInputRef}
                className="hidden"
                onChange={handlePdfMerge}
              />
            </div>
            <div
              className={`flex gap-2 items-center ${
                tool === "text" || getSelectedItem()?.type === "text"
                  ? ""
                  : "opacity-50 pointer-events-none"
              }`}
            >
              <select
                className="h-8 border border-gray-300 rounded px-1 md:px-2 text-sm bg-white outline-none w-20 md:w-auto"
                value={fontName}
                onChange={(e) => {
                  setFontName(e.target.value);
                  if (selectedItemId)
                    updateItem(selectedItemId, { fontFamily: e.target.value });
                }}
              >
                <option value="Sarabun">Sarabun</option>
                <option value="Chakra Petch">Chakra Petch</option>
                <option value="Mali">Mali</option>
              </select>
              <div className="flex items-center bg-white border border-gray-300 rounded h-8 overflow-hidden">
                <button
                  onClick={() => {
                    const newSize =
                      (selectedItemId ? getSelectedItem().fontSize : fontSize) -
                      1;
                    setFontSize(newSize);
                    if (selectedItemId)
                      updateItem(selectedItemId, { fontSize: newSize });
                  }}
                  className="px-2 hover:bg-gray-100 h-full font-bold border-r border-gray-200"
                >
                  -
                </button>
                <span className="text-xs px-2 font-mono min-w-[24px] text-center">
                  {selectedItemId ? getSelectedItem().fontSize : fontSize}
                </span>
                <button
                  onClick={() => {
                    const newSize =
                      (selectedItemId ? getSelectedItem().fontSize : fontSize) +
                      1;
                    setFontSize(newSize);
                    if (selectedItemId)
                      updateItem(selectedItemId, { fontSize: newSize });
                  }}
                  className="px-2 hover:bg-gray-100 h-full font-bold border-l border-gray-200"
                >
                  +
                </button>
              </div>
            </div>
            <div
              className={`flex gap-1 ${
                selectedItemId && getSelectedItem()?.type === "text"
                  ? ""
                  : "opacity-50 pointer-events-none"
              }`}
            >
              <button
                onClick={() =>
                  updateItem(selectedItemId, {
                    fontWeight:
                      getSelectedItem().fontWeight === "bold"
                        ? "normal"
                        : "bold",
                  })
                }
                className={`p-1.5 rounded ${
                  getSelectedItem()?.fontWeight === "bold"
                    ? "bg-gray-200 text-black"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <Bold size={16} />
              </button>
              <button
                onClick={() =>
                  updateItem(selectedItemId, {
                    fontStyle:
                      getSelectedItem().fontStyle === "italic"
                        ? "normal"
                        : "italic",
                  })
                }
                className={`p-1.5 rounded ${
                  getSelectedItem()?.fontStyle === "italic"
                    ? "bg-gray-200 text-black"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <Italic size={16} />
              </button>
              <button
                onClick={() =>
                  updateItem(selectedItemId, {
                    textDecoration:
                      getSelectedItem().textDecoration === "underline"
                        ? "none"
                        : "underline",
                  })
                }
                className={`p-1.5 rounded ${
                  getSelectedItem()?.textDecoration === "underline"
                    ? "bg-gray-200 text-black"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <Underline size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 min-w-max ml-4">
            {selectedItemId && (
              <button
                onClick={deleteItem}
                className="text-red-500 hover:bg-red-50 p-2 rounded transition"
              >
                <Trash2 size={18} />
              </button>
            )}
            <div className="flex items-center bg-white rounded border border-gray-300 px-2 py-1 shadow-sm">
              <ZoomOut
                size={14}
                className="cursor-pointer hover:text-blue-600"
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
              />
              <span className="text-xs w-8 text-center font-bold select-none">
                {zoomLevel}%
              </span>
              <ZoomIn
                size={14}
                className="cursor-pointer hover:text-blue-600"
                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {viewMode === "list" && showSidebar && (
          <div className="absolute md:relative z-30 h-full w-52 bg-[#f5f5f5] border-r border-gray-300 flex flex-col overflow-hidden shadow-lg md:shadow-none">
            <div className="p-3 text-xs font-bold text-gray-500 uppercase border-b border-gray-300 bg-gray-100 flex justify-between items-center">
              <span>Pages ({pages.length})</span>
              <button
                onClick={() => setShowSidebar(false)}
                className="md:hidden p-1"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {pages.map((page, idx) => (
                <div
                  key={page.id}
                  className="p-3 border-b border-gray-200 cursor-pointer hover:bg-white transition flex justify-between items-center group"
                  onClick={() =>
                    document
                      .getElementById(`page-view-${page.id}`)
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <span className="text-sm text-gray-700">หน้า {idx + 1}</span>
                  {page.locked && <Lock size={12} className="text-red-400" />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className="flex-1 overflow-y-auto relative p-4 md:p-10 flex flex-col items-center bg-[#e9e9e9] scroll-smooth"
          onClick={() => {
            if (tool === "cursor") setSelectedItemId(null);
          }}
        >
          {importStatus && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] bg-white text-[#333] px-8 py-6 rounded-lg shadow-2xl flex flex-col items-center gap-4 text-center backdrop-blur-sm border border-gray-200">
              <Loader size={36} className="animate-spin text-[#1e65b6]" />
              <div>
                <h3 className="font-bold text-lg">กำลังประมวลผล</h3>
                <p className="text-sm text-gray-500">{importStatus}</p>
              </div>
            </div>
          )}
          {viewMode === "list" && (
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.2s",
              }}
              className="pb-20"
              ref={editorRef}
            >
              {pages.length === 0 && !isImporting && (
                /* 🔥 แก้ตรงนี้: ปรับกล่องให้กว้างเป็น % แทน pixel */
                <div className="w-[90vw] max-w-[600px] min-h-[300px] bg-white rounded shadow-xl flex flex-col items-center justify-center border border-gray-300 p-4">
                  <CorrectPDFLogo />
                  <p className="text-gray-500 mb-6 text-center px-4 mt-6 text-sm md:text-base">
                    เริ่มต้นใช้งานโดยการเปิดไฟล์ PDF ที่ต้องการแก้ไข
                  </p>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="bg-[#1e65b6] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#164e8d] font-bold flex items-center gap-2 text-lg transition-all"
                  >
                    <Upload size={20} /> เลือกไฟล์ PDF
                  </button>
                </div>
              )}
              {pages.map((page, idx) => (
                <div key={page.id} id={`page-view-${page.id}`}>
                  <div className="page-toolbar">
                    <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                      <span className="pt-title">หน้าที่ {idx + 1}</span>
                      <button
                        className="pt-btn lock"
                        onClick={() => toggleLockPage(page.id)}
                      >
                        {page.locked ? (
                          <Lock size={12} />
                        ) : (
                          <Unlock size={12} />
                        )}{" "}
                        <span className="hidden sm:inline">
                          {page.locked ? "ล็อค" : "ปกติ"}
                        </span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <button
                        className={`pt-btn ${
                          page.locked || idx === 0 ? "disabled" : ""
                        }`}
                        onClick={() => movePage(idx, -1)}
                        title="เลื่อนขึ้น"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        className={`pt-btn ${
                          page.locked || idx === pages.length - 1
                            ? "disabled"
                            : ""
                        }`}
                        onClick={() => movePage(idx, 1)}
                        title="เลื่อนลง"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <div className="divider-v"></div>
                      <button
                        className={`pt-btn delete ${
                          page.locked ? "disabled" : ""
                        }`}
                        onClick={() => handleDeletePage(page.id)}
                        title="ลบหน้านี้"
                      >
                        <Trash2 size={14} />{" "}
                        <span className="hidden sm:inline">ลบ</span>
                      </button>
                    </div>
                  </div>
                  <div
                    className="pdf-page-container"
                    style={{
                      width: page.width + "px",
                      height: page.height + "px",
                      maxWidth: "100%",
                    }}
                  >
                    <img
                      src={page.bgImage}
                      className="pdf-bg-layer"
                      alt="Background"
                      style={{ opacity: page.locked ? 0.8 : 1 }}
                    />
                    {page.locked && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Lock size={64} className="text-red-500/20" />
                      </div>
                    )}
                    <div
                      className="click-layer"
                      style={{
                        cursor:
                          tool !== "cursor" && !page.locked
                            ? "crosshair"
                            : "default",
                        pointerEvents: page.locked ? "none" : "auto",
                      }}
                      onClick={(e) => handlePageClick(e, page.id)}
                    >
                      {items
                        .filter((i) => i.pageId === page.id)
                        .map((item) => (
                          <div
                            key={item.id}
                            className={`canvas-item ${item.type} ${
                              selectedItemId === item.id ? "selected" : ""
                            }`}
                            style={{
                              left: item.x,
                              top: item.y,
                              width: item.width,
                              height: item.height,
                              backgroundColor:
                                item.backgroundColor ||
                                (item.type === "eraser"
                                  ? "white"
                                  : "transparent"),
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (tool === "cursor" && !page.locked)
                                setSelectedItemId(item.id);
                            }}
                            onMouseDown={(e) => {
                              if (
                                tool !== "cursor" ||
                                e.target.tagName === "TEXTAREA" ||
                                page.locked
                              )
                                return;
                              const startX =
                                e.clientX - item.x * (zoomLevel / 100);
                              const startY =
                                e.clientY - item.y * (zoomLevel / 100);
                              const onMove = (ev) =>
                                updateItem(item.id, {
                                  x: ev.clientX / (zoomLevel / 100) - startX,
                                  y: ev.clientY / (zoomLevel / 100) - startY,
                                });
                              const onUp = () => {
                                window.removeEventListener("mousemove", onMove);
                                window.removeEventListener("mouseup", onUp);
                              };
                              window.addEventListener("mousemove", onMove);
                              window.addEventListener("mouseup", onUp);
                            }}
                          >
                            {selectedItemId === item.id && !page.locked && (
                              <div
                                className="move-handle"
                                onMouseDown={(e) =>
                                  handleMoveMouseDown(
                                    e,
                                    item.id,
                                    item.x,
                                    item.y
                                  )
                                }
                              >
                                <Move size={10} />
                              </div>
                            )}
                            {selectedItemId === item.id && !page.locked && (
                              <div
                                className="resize-handle"
                                onMouseDown={(e) =>
                                  handleResizeMouseDown(
                                    e,
                                    item.id,
                                    item.width,
                                    item.height
                                  )
                                }
                              />
                            )}
                            {item.type === "eraser" && (
                              <div className="w-full h-full"></div>
                            )}
                            {item.type === "text" && (
                              <textarea
                                disabled={page.locked}
                                autoFocus={
                                  items[items.length - 1].id === item.id
                                }
                                className="text-area-input"
                                value={item.content}
                                onChange={(e) =>
                                  updateItem(item.id, {
                                    content: e.target.value,
                                  })
                                }
                                style={{
                                  fontSize: item.fontSize,
                                  fontFamily: item.fontFamily,
                                  fontWeight: item.fontWeight,
                                  fontStyle: item.fontStyle,
                                  textDecoration: item.textDecoration,
                                  color: "black",
                                }}
                              />
                            )}
                            {item.type === "image" && (
                              <img
                                src={item.content}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                }}
                                draggable={false}
                              />
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
              {pages.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 mb-10">
                  <button
                    onClick={handleAddBlankPage}
                    className="flex items-center justify-center gap-2 bg-white text-gray-700 px-5 py-2 rounded-full shadow hover:bg-gray-100 font-bold transition border border-gray-300"
                  >
                    <PlusCircle size={18} /> เพิ่มหน้าเปล่า
                  </button>
                  <button
                    onClick={() => mergeInputRef.current.click()}
                    className="flex items-center justify-center gap-2 bg-white text-green-700 px-5 py-2 rounded-full shadow hover:bg-green-50 font-bold transition border border-gray-300"
                  >
                    <FilePlus size={18} /> แทรก PDF ต่อท้าย
                  </button>
                </div>
              )}
            </div>
          )}
          {viewMode === "grid" && (
            <div className="w-full max-w-5xl text-[#333]">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-[#333]">
                  จัดการหน้าเอกสาร ({pages.length} หน้า)
                </h2>
                <div className="flex gap-2 flex-wrap justify-center">
                  <button
                    onClick={selectAllPages}
                    className="px-3 md:px-4 py-2 bg-white rounded hover:bg-gray-100 border border-gray-300 text-xs md:text-sm font-bold shadow-sm"
                  >
                    เลือกทั้งหมด
                  </button>
                  {selectedPageIds.size > 0 && (
                    <button
                      onClick={handleDeleteSelectedPages}
                      className="px-3 md:px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold text-xs md:text-sm shadow animate-pulse"
                    >
                      ลบ {selectedPageIds.size} หน้าที่เลือก
                    </button>
                  )}
                  <button
                    onClick={unlockAllPages}
                    className="px-3 md:px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs md:text-sm font-bold ml-2 shadow-sm"
                  >
                    ปลดล็อคทั้งหมด
                  </button>
                </div>
              </div>
              <div className="grid-container">
                {pages.map((page, idx) => (
                  <div
                    key={page.id}
                    className={`grid-item ${
                      selectedPageIds.has(page.id) ? "selected" : ""
                    }`}
                  >
                    <div
                      className={`grid-select-check ${
                        selectedPageIds.has(page.id) ? "active" : ""
                      }`}
                      onClick={() => togglePageSelection(page.id)}
                    >
                      <div>
                        {selectedPageIds.has(page.id) && <Check size={14} />}
                      </div>
                    </div>
                    <div className="grid-badge">#{idx + 1}</div>
                    <img
                      src={page.bgImage}
                      className="grid-thumb"
                      style={{ opacity: page.locked ? 0.6 : 1 }}
                    />
                    {page.locked && (
                      <Lock
                        size={40}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500"
                      />
                    )}
                    <div className="grid-controls">
                      <button
                        onClick={() => toggleLockPage(page.id)}
                        className="bg-white p-2 rounded hover:bg-gray-200 border border-gray-300"
                        title="ล็อค"
                      >
                        {page.locked ? (
                          <Lock size={16} className="text-red-500" />
                        ) : (
                          <Unlock size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => movePage(idx, -1)}
                        className={`bg-white p-2 rounded hover:bg-gray-200 border border-gray-300 ${
                          page.locked || idx === 0 ? "opacity-50" : ""
                        }`}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => movePage(idx, 1)}
                        className={`bg-white p-2 rounded hover:bg-gray-200 border border-gray-300 ${
                          page.locked || idx === pages.length - 1
                            ? "opacity-50"
                            : ""
                        }`}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePage(page.id)}
                        className={`bg-white p-2 rounded hover:bg-red-50 border border-gray-300 ${
                          page.locked ? "opacity-50" : ""
                        }`}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-8 mb-20">
                <button
                  onClick={() => setViewMode("list")}
                  className="bg-[#1e65b6] text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-[#164e8d] text-lg"
                >
                  เสร็จสิ้น (กลับไปแก้ไข)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      {showSigModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 shadow-2xl w-full max-w-[500px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <PenTool size={20} /> เซ็นลายมือชื่อ
              </h3>
              <button
                onClick={() => setShowSigModal(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white mb-4 relative cursor-crosshair shadow-inner h-[200px] w-full overflow-hidden">
              <canvas
                ref={sigCanvasRef}
                width={450}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={endDrawing}
                className="w-full h-full touch-none"
              />
              <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 pointer-events-none select-none">
                เซ็นชื่อที่นี่
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={clearSignature}
                className="text-red-500 text-sm hover:underline flex items-center gap-1 font-medium"
              >
                <Trash2 size={14} /> ล้างกระดาน
              </button>
              <button
                onClick={saveSignature}
                className="px-6 py-2 bg-[#1e65b6] text-white rounded shadow hover:bg-[#164e8d] font-bold flex items-center gap-2"
              >
                <Check size={16} /> ใช้ลายเซ็นนี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG */}
      {dialog.show && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              {dialog.type === "alert" ? (
                <AlertTriangle className="text-red-500" size={24} />
              ) : (
                <CheckSquare className="text-blue-500" size={24} />
              )}
              <h3 className="text-lg font-bold text-gray-800">
                {dialog.title}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">{dialog.message}</p>
            <div className="flex justify-end gap-3">
              {dialog.type === "confirm" && (
                <button
                  onClick={closeDialog}
                  className="px-4 py-2 rounded text-gray-600 hover:bg-gray-100 font-medium border border-gray-300"
                >
                  ยกเลิก
                </button>
              )}
              <button
                onClick={() => {
                  if (dialog.onConfirm) dialog.onConfirm();
                  closeDialog();
                }}
                className="px-6 py-2 bg-[#1e65b6] text-white rounded hover:bg-[#164e8d] font-bold shadow"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
