import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  FileText,
  Newspaper,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Eye,
  Search,
  Sparkles,
  Shield,
  Layers,
  ArrowUpRight,
  Clock,
  Calendar,
  X,
  RefreshCw,
} from "lucide-react";
import meyvedaLogo from "@/assets/meyvedalogo.png";
import { apiClient } from "@/services/apiClient";
import { toast } from "sonner";

interface PRItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  media_source: string;
  media_source_url?: string | null;
  category: string;
  cover_image_url?: string | null;
  published_date: string;
  is_featured: boolean;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface BlogItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  author_name: string;
  author_role: string;
  category: string;
  cover_image_url?: string | null;
  reading_time: string;
  tags?: string[] | null;
  is_featured: boolean;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface OverviewData {
  metrics: {
    total_pr: number;
    total_blogs: number;
    total_items: number;
    published_count: number;
    draft_count: number;
  };
  prs: PRItem[];
  blogs: BlogItem[];
}

export function ContentManagerPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"pr" | "blogs">("pr");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [data, setData] = useState<OverviewData>({
    metrics: {
      total_pr: 0,
      total_blogs: 0,
      total_items: 0,
      published_count: 0,
      draft_count: 0,
    },
    prs: [],
    blogs: [],
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [prModalOpen, setPrModalOpen] = useState(false);
  const [editingPr, setEditingPr] = useState<PRItem | null>(null);

  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogItem | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "pr" | "blog";
    id: string;
    title: string;
  } | null>(null);

  // Form states: PR
  const [prForm, setPrForm] = useState({
    title: "",
    slug: "",
    category: "Press Release",
    media_source: "Meyveda Media Desk",
    media_source_url: "",
    published_date: new Date().toISOString().split("T")[0],
    summary: "",
    content: "",
    status: "published",
    is_featured: false,
  });

  // Form states: Blog
  const [blogForm, setBlogForm] = useState({
    title: "",
    slug: "",
    author_name: "Meyveda Clinical Desk",
    author_role: "AYUSH Clinical Research",
    category: "Clinical Practice",
    reading_time: "5 min read",
    tags: "",
    summary: "",
    content: "",
    status: "published",
    is_featured: false,
  });

  const userRole = localStorage.getItem("meyveda_user_role") || "";
  const userEmail = localStorage.getItem("meyveda_user_email") || "content@meyveda.com";

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem("meyveda_auth_token");
    const role = (localStorage.getItem("meyveda_user_role") || "").toLowerCase();
    if (!token && role !== "content_manager" && role !== "admin") {
      toast.error("Please sign in to access the Content Management Desk.");
      navigate({ to: "/login" });
    }
  }, [navigate]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await apiClient.get<OverviewData>("/content/manage/all");
      setData(res);
    } catch (err: any) {
      console.warn("Failed to load /content/manage/all, loading public endpoints:", err);
      // Fallback: load public PR and blogs
      try {
        const [prs, blogs] = await Promise.all([
          apiClient.get<PRItem[]>("/content/pr").catch(() => []),
          apiClient.get<BlogItem[]>("/content/blogs").catch(() => []),
        ]);
        const prList = Array.isArray(prs) ? prs : [];
        const blogList = Array.isArray(blogs) ? blogs : [];
        setData({
          metrics: {
            total_pr: prList.length,
            total_blogs: blogList.length,
            total_items: prList.length + blogList.length,
            published_count: prList.length + blogList.length,
            draft_count: 0,
          },
          prs: prList,
          blogs: blogList,
        });
      } catch (innerErr) {
        toast.error("Could not load content catalog.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("meyveda_auth_token");
    localStorage.removeItem("meyveda_user_role");
    localStorage.removeItem("meyveda_user_email");
    toast.success("Signed out of Content Management Desk.");
    window.location.href = "/login";
  };

  // --- PR Operations ---

  const openNewPrModal = () => {
    setEditingPr(null);
    setPrForm({
      title: "",
      slug: "",
      category: "Press Release",
      media_source: "Meyveda Media Desk",
      media_source_url: "",
      published_date: new Date().toISOString().split("T")[0],
      summary: "",
      content: "",
      status: "published",
      is_featured: false,
    });
    setPrModalOpen(true);
  };

  const openEditPrModal = (item: PRItem) => {
    setEditingPr(item);
    setPrForm({
      title: item.title,
      slug: item.slug,
      category: item.category,
      media_source: item.media_source,
      media_source_url: item.media_source_url || "",
      published_date: item.published_date,
      summary: item.summary,
      content: item.content,
      status: item.status,
      is_featured: item.is_featured,
    });
    setPrModalOpen(true);
  };

  const handleSavePr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prForm.title.trim() || !prForm.summary.trim() || !prForm.content.trim()) {
      toast.error("Title, summary, and content are required.");
      return;
    }

    try {
      if (editingPr) {
        await apiClient.put(`/content/pr/${editingPr.id}`, prForm);
        toast.success("Press release updated successfully!");
      } else {
        await apiClient.post("/content/pr", prForm);
        toast.success("New press release published!");
      }
      setPrModalOpen(false);
      loadData(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save press release.");
    }
  };

  const handleTogglePrStatus = async (item: PRItem) => {
    const newStatus = item.status === "published" ? "draft" : "published";
    try {
      await apiClient.put(`/content/pr/${item.id}`, { status: newStatus });
      toast.success(`Press release marked as ${newStatus}.`);
      loadData(true);
    } catch (err: any) {
      toast.error("Failed to toggle status.");
    }
  };

  // --- Blog Operations ---

  const openNewBlogModal = () => {
    setEditingBlog(null);
    setBlogForm({
      title: "",
      slug: "",
      author_name: "Meyveda Clinical Desk",
      author_role: "AYUSH Clinical Research",
      category: "Clinical Practice",
      reading_time: "5 min read",
      tags: "",
      summary: "",
      content: "",
      status: "published",
      is_featured: false,
    });
    setBlogModalOpen(true);
  };

  const openEditBlogModal = (item: BlogItem) => {
    setEditingBlog(item);
    setBlogForm({
      title: item.title,
      slug: item.slug,
      author_name: item.author_name,
      author_role: item.author_role,
      category: item.category,
      reading_time: item.reading_time,
      tags: item.tags ? item.tags.join(", ") : "",
      summary: item.summary,
      content: item.content,
      status: item.status,
      is_featured: item.is_featured,
    });
    setBlogModalOpen(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogForm.title.trim() || !blogForm.summary.trim() || !blogForm.content.trim()) {
      toast.error("Title, summary, and content are required.");
      return;
    }

    const payload = {
      ...blogForm,
      tags: blogForm.tags
        ? blogForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    };

    try {
      if (editingBlog) {
        await apiClient.put(`/content/blogs/${editingBlog.id}`, payload);
        toast.success("Blog post updated successfully!");
      } else {
        await apiClient.post("/content/blogs", payload);
        toast.success("New blog post published!");
      }
      setBlogModalOpen(false);
      loadData(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save blog post.");
    }
  };

  const handleToggleBlogStatus = async (item: BlogItem) => {
    const newStatus = item.status === "published" ? "draft" : "published";
    try {
      await apiClient.put(`/content/blogs/${item.id}`, { status: newStatus });
      toast.success(`Blog post marked as ${newStatus}.`);
      loadData(true);
    } catch (err: any) {
      toast.error("Failed to toggle status.");
    }
  };

  // --- Delete confirmation execution ---

  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === "pr") {
        await apiClient.delete(`/content/pr/${deleteConfirm.id}`);
        toast.success("Press release deleted.");
      } else {
        await apiClient.delete(`/content/blogs/${deleteConfirm.id}`);
        toast.success("Blog post deleted.");
      }
      setDeleteConfirm(null);
      loadData(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete item.");
    }
  };

  // Filtered lists
  const filteredPrs = data.prs.filter(
    (p) =>
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.media_source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBlogs = data.blogs.filter(
    (b) =>
      !searchQuery.trim() ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#111111]">
      {/* -------------------------------------------------------------------- */}
      {/* 1. TOP CMS HEADER                                                    */}
      {/* -------------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-[#E5E0D5] bg-white shadow-2xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center">
              <img
                src={meyvedaLogo}
                alt="Meyveda Logo"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <div className="h-5 w-px bg-[#E5E0D5]" />
            <span className="flex items-center gap-1.5 rounded-full bg-[#FAF4ED] px-3 py-1 text-xs font-bold text-[#E67230]">
              <Shield className="size-3.5" />
              Content Management Desk
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/public-relations"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#555555] hover:text-[#E67230]"
            >
              <span>View PR Page</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
            <Link
              to="/blogs"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#555555] hover:text-[#E67230]"
            >
              <span>View Blogs</span>
              <ArrowUpRight className="size-3.5" />
            </Link>

            <button
              onClick={() => loadData(true)}
              className="inline-flex size-8 items-center justify-center rounded-md border border-[#E5E0D5] text-[#555555] hover:bg-[#FAF9F6] hover:text-[#111111]"
              title="Refresh Content"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-[#E67230]" : ""}`} />
            </button>

            <div className="text-right text-xs">
              <p className="font-bold text-[#111111]">{userEmail}</p>
              <p className="text-[10px] text-[#888888]">Role: content_manager</p>
            </div>

            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 rounded-md border border-[#E5E0D5] bg-white px-3 py-1.5 text-xs font-bold text-[#777777] hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* 2. NOTICE & PERMISSION BAR                                           */}
      {/* -------------------------------------------------------------------- */}
      <div className="border-b border-[#EBE7DF] bg-[#FAF4ED] px-4 py-2.5 text-center text-xs text-[#7A3E1D]">
        <span className="font-bold">Content Editor Permissions Active:</span> You have dedicated privileges to create, edit, publish, and delete Public Relations releases and AYUSH Clinical Blog posts.
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ------------------------------------------------------------------ */}
        {/* 3. METRIC KPI CARDS                                                */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
          <div className="rounded-xl border border-[#E5E0D5] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span>Total Content</span>
              <Layers className="size-4 text-[#E67230]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#111111]">
              {data.metrics.total_items}
            </p>
            <p className="mt-1 text-[11px] text-[#666666]">
              PR Releases + Blog Posts
            </p>
          </div>

          <div className="rounded-xl border border-[#E5E0D5] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span>Published</span>
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-700">
              {data.metrics.published_count}
            </p>
            <p className="mt-1 text-[11px] text-emerald-600">
              Active on Public Site
            </p>
          </div>

          <div className="rounded-xl border border-[#E5E0D5] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span>Drafts</span>
              <AlertCircle className="size-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {data.metrics.draft_count}
            </p>
            <p className="mt-1 text-[11px] text-amber-600">
              Work in Progress
            </p>
          </div>

          <div className="rounded-xl border border-[#E5E0D5] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span>Catalog Split</span>
              <FileText className="size-4 text-blue-600" />
            </div>
            <p className="mt-2 text-lg font-bold text-[#111111]">
              {data.metrics.total_pr} PR / {data.metrics.total_blogs} Blogs
            </p>
            <p className="mt-1 text-[11px] text-[#666666]">
              Dual Content Streams
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 4. TABS & CONTROLS                                                 */}
        {/* ------------------------------------------------------------------ */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E0D5] pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("pr")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                activeTab === "pr"
                  ? "bg-[#111111] text-white shadow-sm"
                  : "bg-white text-[#555555] border border-[#E5E0D5] hover:bg-[#FAF9F6]"
              }`}
            >
              <Newspaper className="size-4" />
              <span>Public Relations ({data.prs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("blogs")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                activeTab === "blogs"
                  ? "bg-[#111111] text-white shadow-sm"
                  : "bg-white text-[#555555] border border-[#E5E0D5] hover:bg-[#FAF9F6]"
              }`}
            >
              <BookOpen className="size-4" />
              <span>Clinical Blogs ({data.blogs.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-[#888888]" />
              <input
                type="text"
                placeholder="Search titles, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 rounded-md border border-[#E5E0D5] bg-white py-1.5 pl-9 pr-3 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
              />
            </div>

            {activeTab === "pr" ? (
              <button
                onClick={openNewPrModal}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#E67230] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#D15F1F] transition-colors"
              >
                <Plus className="size-4" />
                <span>New Press Release</span>
              </button>
            ) : (
              <button
                onClick={openNewBlogModal}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#E67230] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#D15F1F] transition-colors"
              >
                <Plus className="size-4" />
                <span>New Blog Post</span>
              </button>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 5. TAB CONTENT: PUBLIC RELATIONS                                   */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "pr" && (
          <div className="mt-6">
            {filteredPrs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#DCD6CA] bg-white p-12 text-center">
                <Newspaper className="mx-auto size-10 text-[#AAAAAA]" />
                <p className="mt-3 text-sm font-bold text-[#111111]">No press releases found</p>
                <button
                  onClick={openNewPrModal}
                  className="mt-4 inline-flex items-center gap-1 rounded-md bg-[#E67230] px-4 py-2 text-xs font-bold text-white hover:bg-[#D15F1F]"
                >
                  <Plus className="size-3.5" />
                  <span>Create First Press Release</span>
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#E5E0D5] bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#E5E0D5] bg-[#FAF9F6] text-[#555555]">
                      <tr>
                        <th className="py-3.5 pl-6 pr-3 font-semibold">Title & Excerpt</th>
                        <th className="px-3 py-3.5 font-semibold">Category</th>
                        <th className="px-3 py-3.5 font-semibold">Media Source</th>
                        <th className="px-3 py-3.5 font-semibold">Date</th>
                        <th className="px-3 py-3.5 font-semibold">Status</th>
                        <th className="py-3.5 pl-3 pr-6 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE1]">
                      {filteredPrs.map((item) => (
                        <tr key={item.id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                          <td className="py-4 pl-6 pr-3">
                            <div className="max-w-md">
                              <p className="font-bold text-[#111111] line-clamp-1">{item.title}</p>
                              <p className="mt-0.5 text-[#666666] line-clamp-1">{item.summary}</p>
                              <p className="mt-1 font-mono text-[10px] text-[#999999]">slug: /{item.slug}</p>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <span className="rounded-full bg-[#FAF4ED] px-2.5 py-0.5 font-semibold text-[#E67230]">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-[#555555]">
                            {item.media_source}
                          </td>
                          <td className="px-3 py-4 text-[#666666]">
                            {item.published_date}
                          </td>
                          <td className="px-3 py-4">
                            <button
                              onClick={() => handleTogglePrStatus(item)}
                              className={`rounded-full px-2.5 py-0.5 font-bold transition-all ${
                                item.status === "published"
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                              }`}
                              title="Click to toggle publish/draft"
                            >
                              {item.status === "published" ? "Published" : "Draft"}
                            </button>
                          </td>
                          <td className="py-4 pl-3 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditPrModal(item)}
                                className="rounded p-1.5 text-[#555555] hover:bg-[#FAF4ED] hover:text-[#E67230]"
                                title="Edit"
                              >
                                <Edit2 className="size-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: "pr",
                                    id: item.id,
                                    title: item.title,
                                  })
                                }
                                className="rounded p-1.5 text-[#555555] hover:bg-red-50 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* 6. TAB CONTENT: BLOGS                                              */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "blogs" && (
          <div className="mt-6">
            {filteredBlogs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#DCD6CA] bg-white p-12 text-center">
                <BookOpen className="mx-auto size-10 text-[#AAAAAA]" />
                <p className="mt-3 text-sm font-bold text-[#111111]">No blog posts found</p>
                <button
                  onClick={openNewBlogModal}
                  className="mt-4 inline-flex items-center gap-1 rounded-md bg-[#E67230] px-4 py-2 text-xs font-bold text-white hover:bg-[#D15F1F]"
                >
                  <Plus className="size-3.5" />
                  <span>Create First Blog Post</span>
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#E5E0D5] bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#E5E0D5] bg-[#FAF9F6] text-[#555555]">
                      <tr>
                        <th className="py-3.5 pl-6 pr-3 font-semibold">Title & Summary</th>
                        <th className="px-3 py-3.5 font-semibold">Category</th>
                        <th className="px-3 py-3.5 font-semibold">Author</th>
                        <th className="px-3 py-3.5 font-semibold">Reading Time</th>
                        <th className="px-3 py-3.5 font-semibold">Status</th>
                        <th className="py-3.5 pl-3 pr-6 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE1]">
                      {filteredBlogs.map((item) => (
                        <tr key={item.id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                          <td className="py-4 pl-6 pr-3">
                            <div className="max-w-md">
                              <p className="font-bold text-[#111111] line-clamp-1">{item.title}</p>
                              <p className="mt-0.5 text-[#666666] line-clamp-1">{item.summary}</p>
                              <p className="mt-1 font-mono text-[10px] text-[#999999]">slug: /{item.slug}</p>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <span className="rounded-full bg-[#FAF4ED] px-2.5 py-0.5 font-semibold text-[#E67230]">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-[#555555]">
                            <p className="font-semibold text-[#111111]">{item.author_name}</p>
                            <p className="text-[10px] text-[#888888]">{item.author_role}</p>
                          </td>
                          <td className="px-3 py-4 text-[#666666]">
                            {item.reading_time}
                          </td>
                          <td className="px-3 py-4">
                            <button
                              onClick={() => handleToggleBlogStatus(item)}
                              className={`rounded-full px-2.5 py-0.5 font-bold transition-all ${
                                item.status === "published"
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                              }`}
                              title="Click to toggle publish/draft"
                            >
                              {item.status === "published" ? "Published" : "Draft"}
                            </button>
                          </td>
                          <td className="py-4 pl-3 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditBlogModal(item)}
                                className="rounded p-1.5 text-[#555555] hover:bg-[#FAF4ED] hover:text-[#E67230]"
                                title="Edit"
                              >
                                <Edit2 className="size-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: "blog",
                                    id: item.id,
                                    title: item.title,
                                  })
                                }
                                className="rounded p-1.5 text-[#555555] hover:bg-red-50 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* 7. MODAL: ADD / EDIT PRESS RELEASE                                   */}
      {/* -------------------------------------------------------------------- */}
      {prModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setPrModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-[#888888] hover:bg-[#FAF9F6] hover:text-[#111111]"
            >
              <X className="size-5" />
            </button>

            <h2 className="text-xl font-bold text-[#111111]">
              {editingPr ? "Edit Press Release" : "Publish New Press Release"}
            </h2>
            <p className="mt-1 text-xs text-[#666666]">
              Announcements will appear live on the public `/public-relations` newsroom.
            </p>

            <form onSubmit={handleSavePr} className="mt-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#333333]">Title *</label>
                <input
                  type="text"
                  required
                  value={prForm.title}
                  onChange={(e) => setPrForm({ ...prForm, title: e.target.value })}
                  placeholder="e.g. Meyveda Expands AYUSH Clinical Desk Coverage..."
                  className="mt-1 w-full rounded-md border border-[#E5E0D5] p-2.5 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-[#333333]">Category</label>
                  <select
                    value={prForm.category}
                    onChange={(e) => setPrForm({ ...prForm, category: e.target.value })}
                    className="mt-1 w-full rounded-md border border-[#E5E0D5] p-2.5 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
                  >
                    <option>Press Release</option>
                    <option>Media Coverage</option>
                    <option>Statutory Milestone</option>
                    <option>Partnership Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#333333]">Media Source</label>
                  <input
                    type="text"
                    value={prForm.media_source}
                    onChange={(e) => setPrForm({ ...prForm, media_source: e.target.value })}
                    placeholder="e.g. Meyveda Media Desk, The Hindu..."
                    className="mt-1 w-full rounded-md border border-[#E5E0D5] p-2.5 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-[#333333]">Publication Date</label>
                  <input
                    type="date"
                    value={prForm.published_date}
                    onChange={(e) => setPrForm({ ...prForm, published_date: e.target.value })}
                    className="mt-1 w-full rounded-md border border-[#E5E0D5] p-2.5 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#333333]">External Press Link (Optional)</label>
                  <input
                    type="url"
                    value={prForm.media_source_url}
                    onChange={(e) => setPrForm({ ...prForm, media_source_url: e.target.value })}
                    placeholder="https://example.com/press-article"
                    className="mt-1 w-full rounded-md border border-[#E5E0D5] p-2.5 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#333333]">Summary / Excerpt *</label>
                <textarea
                  required
                  rows={2}
                  value={prForm.summary}
                  onChange={(e) => setPrForm({ ...prForm, summary: e.target.value })}
                  placeholder="Short 1-2 sentence overview for news card previews..."
                  className="mt-1 w-full rounded-md border border-[#E5E0D5] p-2.5 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#333333]">Full Content *</label>
                <textarea
                  required
                  rows={6}
                  value={prForm.content}
                  onChange={(e) => setPrForm({ ...prForm, content: e.target.value })}
                  placeholder="Full text of the announcement. Paragraphs separated by blank lines..."
                  className="mt-1 w-full rounded-md border border-[#E5E0D5] p-2.5 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prForm.status === "published"}
                    onChange={(e) =>
                      setPrForm({
                        ...prForm,
                        status: e.target.checked ? "published" : "draft",
                      })
                    }
                    className="size-4 rounded text-[#E67230] focus:ring-[#E67230]"
                  />
                  <span className="font-semibold text-[#333333]">Publish immediately</span>
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#E5E0D5] pt-4">
                <button
                  type="button"
                  onClick={() => setPrModalOpen(false)}
                  className="rounded-md border border-[#E5E0D5] px-4 py-2 font-semibold text-[#555555] hover:bg-[#FAF9F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#E67230] px-5 py-2 font-bold text-white hover:bg-[#D15F1F]"
                >
                  {editingPr ? "Update Release" : "Publish Release"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 8. MODAL: ADD / EDIT BLOG POST                                       */}
      {/* -------------------------------------------------------------------- */}
      {blogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setBlogModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-[#888888] hover:bg-[#FAF9F6] hover:text-[#111111]"
            >
              <X className="size-5" />
            </button>

            <h2 className="text-xl font-bold text-[#111111]">
              {editingBlog ? "Edit Blog Post" : "Author New Blog Post"}
            </h2>
            <p className="mt-1 text-xs text-[#666666]">
              Blogs will appear live on the public `/blogs` portal.
            </p>

            <form onSubmit={handleSaveBlog} className="mt-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#333333]">Blog Title *</label>
                <input
                  type="text"
                  required
                  value={blogForm.title}
                  onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  placeholder="e.g. Standardizing Prakriti Diagnostics: Bridging Nadi Pariksha..."
                  className="mt-1 w-full rounded-md border border-[#E5E0D5] p-2.5 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-[#333333]">Author Name</label>
                  <input
                    type="text"
                    value={blogForm.author_name}
                    onChange={(e) => setBlogForm({ ...blogForm, author_name: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Vaidya, BAMS"
                    className="mt-1 w-full rounded-md border border-[#E5E0D5] p-2.5 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#333333]">Author Role / Title</label>
                  <input
                    type="text"
                    value={blogForm.author_role}
                    onChange={(e) => setBlogForm({ ...blogForm, author_role: e.target.value })}
                    placeholder="e.g. Senior Ayurvedic Physician & Informatics Lead"
                    className="mt-1 w-full rounded-md border border-[#E5E0D5] p-2.5 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block font-semibold text-[#333333]">Category</label>
                  <select
                    value={blogForm.category}
                    onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                    className="mt-1 w-full rounded-md border border-[#E5E0D5] p-2.5 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
                  >
                    <option>Clinical Practice</option>
                    <option>Ayurvedic Pharmacology</option>
                    <option>Integrative Medicine</option>
                    <option>Regulatory & ABDM</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#333333]">Reading Time</label>
                  <input
                    type="text"
                    value={blogForm.reading_time}
                    onChange={(e) => setBlogForm({ ...blogForm, reading_time: e.target.value })}
                    placeholder="e.g. 5 min read"
                    className="mt-1 w-full rounded-md border border-[#E5E0D5] p-2.5 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#333333]">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={blogForm.tags}
                    onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
                    placeholder="e.g. Kayachikitsa, ABDM, Nadi"
                    className="mt-1 w-full rounded-md border border-[#E5E0D5] p-2.5 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#333333]">Summary / Abstract *</label>
                <textarea
                  required
                  rows={2}
                  value={blogForm.summary}
                  onChange={(e) => setBlogForm({ ...blogForm, summary: e.target.value })}
                  placeholder="Short abstract summarizing key clinical findings..."
                  className="mt-1 w-full rounded-md border border-[#E5E0D5] p-2.5 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#333333]">Blog Content *</label>
                <textarea
                  required
                  rows={6}
                  value={blogForm.content}
                  onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                  placeholder="Full blog body. Blank lines indicate separate paragraphs..."
                  className="mt-1 w-full rounded-md border border-[#E5E0D5] p-2.5 text-xs text-[#111111] focus:border-[#E67230] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blogForm.status === "published"}
                    onChange={(e) =>
                      setBlogForm({
                        ...blogForm,
                        status: e.target.checked ? "published" : "draft",
                      })
                    }
                    className="size-4 rounded text-[#E67230] focus:ring-[#E67230]"
                  />
                  <span className="font-semibold text-[#333333]">Publish immediately</span>
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#E5E0D5] pt-4">
                <button
                  type="button"
                  onClick={() => setBlogModalOpen(false)}
                  className="rounded-md border border-[#E5E0D5] px-4 py-2 font-semibold text-[#555555] hover:bg-[#FAF9F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#E67230] px-5 py-2 font-bold text-white hover:bg-[#D15F1F]"
                >
                  {editingBlog ? "Update Blog" : "Publish Blog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 9. MODAL: DELETE CONFIRMATION                                        */}
      {/* -------------------------------------------------------------------- */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#111111]">Confirm Deletion</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#666666]">
              Are you sure you want to permanently delete: <br />
              <strong className="text-[#111111]">"{deleteConfirm.title}"</strong>?
              This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-md border border-[#E5E0D5] px-4 py-2 text-xs font-semibold text-[#555555] hover:bg-[#FAF9F6]"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

