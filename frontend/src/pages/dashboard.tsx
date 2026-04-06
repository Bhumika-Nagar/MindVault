import { CheckCircle2, LoaderCircle, LogOut, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateContentForm } from "../components/content/CreateContentForm";
import { ContentCard } from "../components/dashboard/ContentCard";
import { clearStoredToken } from "../lib/auth";
import { contentService } from "../services/content";
import type { Content, ContentType } from "../types/content";

const initialForm = {
  title: "",
  link: "",
  type: "article" as ContentType
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(initialForm);
  const [contentItems, setContentItems] = useState<Content[]>([]);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function loadContent() {
    setIsLoading(true);
    try {
      const response = await contentService.list();
      setContentItems(response.content);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to load content.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadContent();
  }, []);

  function handleChange(field: "title" | "link" | "type", value: string | ContentType) {
    setFormValues((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleCreate() {
    setSubmitError(null);
    setSubmitMessage(null);
    setIsSubmitting(true);

    try {
      const response = await contentService.create(formValues);
      setContentItems((current) => [response.content, ...current]);
      setFormValues(initialForm);
      setSubmitMessage(response.message);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create content.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(contentId: string) {
    setDeletingId(contentId);
    setSubmitError(null);

    try {
      await contentService.remove(contentId);
      setContentItems((current) => current.filter((item) => item._id !== contentId));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to delete content.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleShare(share: boolean) {
    setIsSharing(true);
    setSubmitError(null);

    try {
      const response = await contentService.share(share);
      setShareLink(response.shareUrl ?? (response.hash ? `${window.location.origin}/shared/${response.hash}` : null));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to update share link.");
    } finally {
      setIsSharing(false);
    }
  }

  function handleLogout() {
    clearStoredToken();
    navigate("/signin", { replace: true });
  }

  return (
    <div className="min-h-full bg-canvas px-4 py-6 dark:bg-canvas-dark sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="surface flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone-400">MindVault</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              Dashboard
            </h1>
            <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">
              Create content, review saved items, remove entries, and generate a shareable brain link from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_1.4fr]">
          <div className="space-y-6">
            <CreateContentForm
              values={formValues}
              isSubmitting={isSubmitting}
              submitMessage={submitMessage}
              submitError={submitError}
              onChange={handleChange}
              onSubmit={() => {
                void handleCreate();
              }}
            />

            <section className="surface p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone-400">Share</p>
                  <h2 className="mt-2 text-xl font-semibold text-stone-900 dark:text-stone-100">
                    Public brain link
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">
                    Turn sharing on to generate a reusable public link for your current saved content.
                  </p>
                </div>
                <Share2 className="size-5 text-stone-400" />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void handleShare(true);
                  }}
                  disabled={isSharing}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
                >
                  {isSharing ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  Enable sharing
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void handleShare(false);
                  }}
                  disabled={isSharing}
                  className="inline-flex items-center justify-center rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  Disable sharing
                </button>
              </div>

              {shareLink ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4" />
                    Sharing is active
                  </div>
                  <p className="mt-2 break-all">{shareLink}</p>
                </div>
              ) : null}
            </section>
          </div>

          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone-400">Library</p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-900 dark:text-stone-100">
                  Saved content
                </h2>
              </div>
              <p className="text-sm text-stone-400">
                {contentItems.length} {contentItems.length === 1 ? "item" : "items"}
              </p>
            </div>

            {isLoading ? (
              <div className="surface flex min-h-48 items-center justify-center">
                <LoaderCircle className="size-5 animate-spin text-stone-400" />
              </div>
            ) : contentItems.length === 0 ? (
              <div className="surface p-6 text-sm leading-6 text-stone-500 dark:text-stone-400">
                No saved content yet. Create your first item from the form on the left.
              </div>
            ) : (
              <div className="grid gap-4">
                {contentItems.map((item) => (
                  <ContentCard
                    key={item._id}
                    item={item}
                    onDelete={(contentId) => {
                      void handleDelete(contentId);
                    }}
                    isDeleting={deletingId === item._id}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
