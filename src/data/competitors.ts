export interface CompetitorFeature {
  category: string;
  mina: string;
  competitor: string;
  minaWins: boolean | null;
}

export interface CompetitorData {
  slug: string;
  name: string;
  tagline: string;
  website: string;
  github: string;
  stats: {
    stars: string;
    bundleSize: string;
    license: string;
    lastUpdate: string;
    framework: string;
  };
  features: CompetitorFeature[];
  minaWins: string[];
  competitorWins: string[];
  codeComparison: {
    minaCode: string;
    competitorCode: string;
    minaLines: number;
    competitorLines: number;
  };
  verdict: {
    chooseMina: string[];
    chooseCompetitor: string[];
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

const minaStats = {
  stars: "New",
  bundleSize: "~45KB",
  license: "MIT",
  lastUpdate: "Active",
  framework: "React",
};

const minaCode = `import { Editor } from "@/components/ui/rich-editor"

function App() {
  return (
    <Editor
      initialContent={content}
      onChange={({ json, html }) => save(json)}
    />
  )
}`;

export const competitors: Record<string, CompetitorData> = {
  tiptap: {
    slug: "tiptap",
    name: "TipTap",
    tagline: "The headless editor framework for web artisans",
    website: "https://tiptap.dev",
    github: "https://github.com/ueberdosis/tiptap",
    stats: {
      stars: "35.7k",
      bundleSize: "120KB+",
      license: "MIT + paid extensions",
      lastUpdate: "Active",
      framework: "Framework-agnostic",
    },
    features: [
      { category: "Setup complexity", mina: "3 lines", competitor: "20+ lines + plugins", minaWins: true },
      { category: "Pre-built toolbar", mina: "Included", competitor: "Build your own", minaWins: true },
      { category: "Markdown shortcuts", mina: "Built-in", competitor: "Extension required", minaWins: true },
      { category: "Smart paste", mina: "MD → rich blocks", competitor: "Plain text", minaWins: true },
      { category: "ProseMirror knowledge", mina: "Not needed", competitor: "Required", minaWins: true },
      { category: "HTML export", mina: "Semantic, clean", competitor: "ProseMirror markup", minaWins: true },
      { category: "Bundle size", mina: "~45KB gzip", competitor: "~120KB+", minaWins: true },
      { category: "Block drag & drop", mina: "Built-in, free", competitor: "Paid extension", minaWins: true },
      { category: "AI integration", mina: "Built-in, any provider", competitor: "Not included", minaWins: true },
      { category: "Real-time collaboration", mina: "Built-in (Y.js)", competitor: "Paid add-on", minaWins: true },
      { category: "Extension ecosystem", mina: "Growing", competitor: "100+ extensions", minaWins: false },
      { category: "Community size", mina: "New", competitor: "35.7k stars", minaWins: false },
      { category: "Price", mina: "Free, MIT", competitor: "Open core", minaWins: true },
    ],
    minaWins: [
      "3-line setup vs 20+ lines of boilerplate with TipTap",
      "Pre-built toolbar included — no need to build UI from scratch",
      "Smaller bundle size (~45KB vs 120KB+ with extensions)",
      "Built-in markdown shortcuts without extra extensions",
      "Free block drag & drop (paid extension in TipTap)",
      "Built-in AI integration — works with any LLM provider",
      "Built-in Y.js real-time collaboration (paid in TipTap)",
      "No ProseMirror knowledge required",
    ],
    competitorWins: [
      "100+ battle-tested extensions for every use case",
      "Massive community with 35.7k GitHub stars",
      "Used in production by GitLab, PostHog, and more",
      "Mature plugin architecture with schema validation",
      "Framework-agnostic — works with Vue, React, vanilla JS",
    ],
    codeComparison: {
      minaCode,
      competitorCode: `import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import DragHandle from '@tiptap-pro/extension-drag-handle'

function App() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Type...' }),
      DragHandle,
    ],
    content: '<p>Hello</p>',
    onUpdate: ({ editor }) => {
      save(editor.getHTML())
    },
  })

  return (
    <>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </>
  )
}`,
      minaLines: 9,
      competitorLines: 21,
    },
    verdict: {
      chooseMina: [
        "You want a working editor in minutes, not hours",
        "You need Notion-style UX without building it yourself",
        "You prefer a smaller bundle with batteries included",
        "You don't want to learn ProseMirror internals",
      ],
      chooseCompetitor: [
        "You need 100+ specialized extensions",
        "You're building a deeply customized editing experience",
        "You need framework-agnostic support (Vue, vanilla JS)",
        "You want battle-tested production stability (GitLab, PostHog)",
      ],
    },
    seo: {
      title: "Mina vs TipTap — Which React Editor Should You Choose?",
      description: "Honest comparison between Mina Rich Editor and TipTap. Compare setup complexity, bundle size, features, pricing, and developer experience side by side.",
      keywords: ["mina vs tiptap", "tiptap alternative", "react editor comparison", "best react editor", "tiptap vs mina"],
    },
  },

  plate: {
    slug: "plate",
    name: "Plate",
    tagline: "The rich-text editor framework for React",
    website: "https://platejs.org",
    github: "https://github.com/udecode/plate",
    stats: {
      stars: "16k",
      bundleSize: "~80KB",
      license: "MIT",
      lastUpdate: "Active",
      framework: "React",
    },
    features: [
      { category: "Setup complexity", mina: "3 lines", competitor: "Complex plugin config", minaWins: true },
      { category: "Pre-built UI", mina: "Included", competitor: "Headless (BYO UI)", minaWins: true },
      { category: "Bundle size", mina: "~45KB", competitor: "~80KB", minaWins: true },
      { category: "Slate knowledge", mina: "Not needed", competitor: "Required", minaWins: true },
      { category: "Notion-style UX", mina: "Out of the box", competitor: "Requires assembly", minaWins: true },
      { category: "AI integration", mina: "Built-in, any provider", competitor: "Not included", minaWins: true },
      { category: "Real-time collaboration", mina: "Built-in (Y.js)", competitor: "Plugin required", minaWins: true },
      { category: "Plugin count", mina: "Growing", competitor: "50+ plugins", minaWins: false },
      { category: "Headless flexibility", mina: "Opinionated", competitor: "Fully headless", minaWins: false },
      { category: "Deep customization", mina: "CSS variables", competitor: "Full control", minaWins: false },
      { category: "Community", mina: "New", competitor: "16k stars", minaWins: false },
      { category: "TypeScript", mina: "First-class", competitor: "First-class", minaWins: null },
    ],
    minaWins: [
      "Simpler setup — 3 lines vs complex plugin configuration",
      "Pre-built UI components included out of the box",
      "Smaller bundle size (~45KB vs ~80KB)",
      "Built-in AI generation with any LLM provider",
      "Built-in Y.js real-time collaboration",
      "No Slate knowledge required",
      "Notion-style UX works immediately without assembly",
    ],
    competitorWins: [
      "50+ plugins for specialized editing needs",
      "Fully headless — complete UI control",
      "Deeper customization for complex use cases",
      "Larger community with 16k GitHub stars",
      "More mature plugin architecture",
    ],
    codeComparison: {
      minaCode,
      competitorCode: `import { Plate, PlateContent } from '@udecode/plate-common'
import { createBoldPlugin } from '@udecode/plate-basic-marks'
import { createHeadingPlugin } from '@udecode/plate-heading'
import { createParagraphPlugin } from '@udecode/plate-paragraph'
import { createBlockquotePlugin } from '@udecode/plate-block-quote'
import { createListPlugin } from '@udecode/plate-list'

function App() {
  const plugins = [
    createParagraphPlugin(),
    createHeadingPlugin(),
    createBoldPlugin(),
    createBlockquotePlugin(),
    createListPlugin(),
  ]

  return (
    <Plate plugins={plugins} initialValue={content}>
      <FixedToolbar>
        <ToolbarButtons />
      </FixedToolbar>
      <PlateContent />
    </Plate>
  )
}`,
      minaLines: 9,
      competitorLines: 23,
    },
    verdict: {
      chooseMina: [
        "You want a working editor fast without assembling plugins",
        "You prefer batteries-included over headless flexibility",
        "You need Notion-style blocks without configuration",
        "You want the smallest possible bundle",
      ],
      chooseCompetitor: [
        "You need full headless control over every UI element",
        "You're building a complex editor with 50+ plugins",
        "You need deep Slate-level customization",
        "You want a larger, more established community",
      ],
    },
    seo: {
      title: "Mina vs Plate — Which React Editor Framework Fits Your Project?",
      description: "Compare Mina Rich Editor and Plate (Udecode). Setup complexity, plugin ecosystems, bundle sizes, and developer experience compared honestly.",
      keywords: ["mina vs plate", "plate editor alternative", "react editor framework", "udecode plate comparison"],
    },
  },

  blocknote: {
    slug: "blocknote",
    name: "BlockNote",
    tagline: "The open source Block-Based rich text editor",
    website: "https://www.blocknotejs.org",
    github: "https://github.com/TypeCellOS/BlockNote",
    stats: {
      stars: "9.2k",
      bundleSize: "~120KB",
      license: "MPL-2.0 + paid",
      lastUpdate: "Active",
      framework: "React",
    },
    features: [
      { category: "Bundle size", mina: "~45KB", competitor: "~120KB", minaWins: true },
      { category: "License", mina: "MIT (fully free)", competitor: "MPL-2.0 + commercial", minaWins: true },
      { category: "API simplicity", mina: "Simple hooks", competitor: "Complex API surface", minaWins: true },
      { category: "AI features", mina: "Free, provider-agnostic", competitor: "Paid add-on", minaWins: true },
      { category: "Notion-style UX", mina: "Good", competitor: "Excellent", minaWins: false },
      { category: "Collaboration", mina: "Coming soon", competitor: "First-class Yjs", minaWins: false },
      { category: "Export formats", mina: "HTML, JSON, MD", competitor: "HTML, JSON, MD, PDF, Word", minaWins: false },
      { category: "Block types", mina: "12+ types", competitor: "15+ types", minaWins: null },
      { category: "Drag & drop", mina: "Built-in", competitor: "Built-in", minaWins: null },
      { category: "Slash commands", mina: "Built-in", competitor: "Built-in", minaWins: null },
    ],
    minaWins: [
      "Significantly smaller bundle (~45KB vs ~120KB)",
      "MIT license — no commercial fees for any feature",
      "Simpler, cleaner API with less surface area",
      "Free AI features, works with any provider",
      "Two editor variants (Full + Compact) for different use cases",
    ],
    competitorWins: [
      "More mature Notion-style UX with polished interactions",
      "First-class Yjs collaboration built in",
      "More export formats including PDF and Word",
      "Larger community with 9.2k stars",
      "More block types out of the box",
    ],
    codeComparison: {
      minaCode,
      competitorCode: `import { BlockNoteView } from "@blocknote/mantine"
import { useCreateBlockNote } from "@blocknote/react"
import "@blocknote/mantine/style.css"
import "@blocknote/core/fonts/inter.css"

function App() {
  const editor = useCreateBlockNote({
    initialContent: content,
  })

  return (
    <BlockNoteView
      editor={editor}
      onChange={() => {
        save(editor.document)
      }}
    />
  )
}`,
      minaLines: 9,
      competitorLines: 17,
    },
    verdict: {
      chooseMina: [
        "Bundle size is a priority for your application",
        "You want MIT license with no commercial restrictions",
        "You need a simpler API with less learning curve",
        "You want free AI features without vendor lock-in",
      ],
      chooseCompetitor: [
        "You need real-time collaboration with Yjs today",
        "You need PDF/Word export built in",
        "You want the most polished Notion-style experience",
        "You don't mind the larger bundle and MPL license",
      ],
    },
    seo: {
      title: "Mina vs BlockNote — Block Editor Comparison for React",
      description: "Mina Rich Editor vs BlockNote: compare bundle sizes, licensing, collaboration features, and block-based editing capabilities for React applications.",
      keywords: ["mina vs blocknote", "blocknote alternative", "block editor react", "notion-style editor comparison"],
    },
  },

  lexical: {
    slug: "lexical",
    name: "Lexical",
    tagline: "An extensible text editor framework by Meta",
    website: "https://lexical.dev",
    github: "https://github.com/facebook/lexical",
    stats: {
      stars: "23.1k",
      bundleSize: "22KB core",
      license: "MIT",
      lastUpdate: "Active",
      framework: "Framework-agnostic",
    },
    features: [
      { category: "Pre-built UI", mina: "Full UI included", competitor: "Headless (BYO everything)", minaWins: true },
      { category: "Setup time", mina: "Minutes", competitor: "Hours to days", minaWins: true },
      { category: "Block-based editing", mina: "Out of the box", competitor: "Build from scratch", minaWins: true },
      { category: "Slash commands", mina: "Built-in", competitor: "Build from scratch", minaWins: true },
      { category: "AI integration", mina: "Built-in, any provider", competitor: "Not included", minaWins: true },
      { category: "Real-time collaboration", mina: "Built-in (Y.js)", competitor: "Build from scratch", minaWins: true },
      { category: "Learning curve", mina: "Gentle", competitor: "Steep", minaWins: true },
      { category: "Core size", mina: "~45KB", competitor: "22KB", minaWins: false },
      { category: "Backing", mina: "Independent", competitor: "Meta (Facebook)", minaWins: false },
      { category: "Accessibility", mina: "Good", competitor: "Excellent", minaWins: false },
      { category: "Framework support", mina: "React only", competitor: "Any framework", minaWins: false },
      { category: "Community", mina: "New", competitor: "23.1k stars", minaWins: false },
    ],
    minaWins: [
      "Pre-built UI — toolbar, menus, and blocks included",
      "Working editor in minutes, not hours or days",
      "Block-based editing out of the box",
      "Slash commands and markdown shortcuts included",
      "Built-in AI generation — provider-agnostic, works with any LLM",
      "Built-in Y.js real-time collaboration",
      "Much gentler learning curve for React developers",
    ],
    competitorWins: [
      "Smallest core bundle at just 22KB",
      "Backed by Meta with excellent engineering resources",
      "Best-in-class accessibility support",
      "Framework-agnostic — works everywhere",
      "Massive community with 23.1k stars",
    ],
    codeComparison: {
      minaCode,
      competitorCode: `import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'

const config = {
  namespace: 'MyEditor',
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
  onError: (error) => console.error(error),
}

function App() {
  return (
    <LexicalComposer initialConfig={config}>
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <OnChangePlugin onChange={save} />
    </LexicalComposer>
  )
}`,
      minaLines: 9,
      competitorLines: 26,
    },
    verdict: {
      chooseMina: [
        "You want a working editor immediately, not a framework",
        "You need block-based editing without building it yourself",
        "You prefer batteries-included over assembling pieces",
        "You're a React developer who wants minimal setup",
      ],
      chooseCompetitor: [
        "You need the absolute smallest core bundle",
        "You want Meta-backed long-term stability",
        "You need framework-agnostic support",
        "You're building a deeply custom editing experience from scratch",
      ],
    },
    seo: {
      title: "Mina vs Lexical — Pre-built Editor vs Meta's Framework",
      description: "Compare Mina Rich Editor with Meta's Lexical framework. Pre-built UI vs headless, setup time, bundle size, and developer experience compared.",
      keywords: ["mina vs lexical", "lexical alternative", "meta editor comparison", "react rich text editor"],
    },
  },

  "editor-js": {
    slug: "editor-js",
    name: "Editor.js",
    tagline: "Next generation block-styled editor",
    website: "https://editorjs.io",
    github: "https://github.com/codex-team/editor.js",
    stats: {
      stars: "31.6k",
      bundleSize: "~100KB",
      license: "MIT",
      lastUpdate: "Medium activity",
      framework: "Vanilla JS",
    },
    features: [
      { category: "Maintenance", mina: "Actively maintained", competitor: "Medium activity", minaWins: true },
      { category: "React integration", mina: "Native React", competitor: "Wrapper needed", minaWins: true },
      { category: "TypeScript", mina: "First-class", competitor: "Community types", minaWins: true },
      { category: "Document structure", mina: "Tree (nested)", competitor: "Flat blocks", minaWins: true },
      { category: "Inline formatting", mina: "Full support", competitor: "Limited", minaWins: true },
      { category: "Drag & drop", mina: "Built-in", competitor: "Plugin required", minaWins: true },
      { category: "AI integration", mina: "Built-in, any provider", competitor: "Not available", minaWins: true },
      { category: "Real-time collaboration", mina: "Built-in (Y.js)", competitor: "Not available", minaWins: true },
      { category: "Community size", mina: "New", competitor: "31.6k stars", minaWins: false },
      { category: "Framework support", mina: "React only", competitor: "Any framework", minaWins: false },
      { category: "JSON output", mina: "Tree structure", competitor: "Clean flat JSON", minaWins: null },
      { category: "Plugin API", mina: "React components", competitor: "Simple class-based", minaWins: null },
    ],
    minaWins: [
      "Active maintenance with regular updates",
      "Native React integration — no wrappers needed",
      "TypeScript-first with full type coverage",
      "Built-in AI generation with any LLM provider",
      "Built-in Y.js real-time collaboration",
      "Tree document structure supports nesting",
      "Full inline formatting (bold, italic, links, etc.)",
      "Built-in drag & drop without plugins",
    ],
    competitorWins: [
      "Larger community with 31.6k GitHub stars",
      "Framework-agnostic — works with any tech stack",
      "Clean, flat JSON output that's easy to work with",
      "Simple class-based plugin API",
      "More established with longer track record",
    ],
    codeComparison: {
      minaCode,
      competitorCode: `import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Quote from '@editorjs/quote'
import ImageTool from '@editorjs/image'

const editor = new EditorJS({
  holder: 'editor',
  tools: {
    header: Header,
    list: List,
    quote: Quote,
    image: {
      class: ImageTool,
      config: {
        endpoints: { byFile: '/upload' }
      }
    }
  },
  data: savedContent,
  onChange: async () => {
    const data = await editor.save()
    saveToDatabase(data)
  }
})`,
      minaLines: 9,
      competitorLines: 23,
    },
    verdict: {
      chooseMina: [
        "You're building a React application",
        "You need nested document structure (not flat blocks)",
        "You want TypeScript-first development",
        "You need active maintenance and updates",
      ],
      chooseCompetitor: [
        "You need framework-agnostic support",
        "You prefer simple, flat JSON output",
        "You want a large, established community",
        "You're building with vanilla JS or non-React frameworks",
      ],
    },
    seo: {
      title: "Mina vs Editor.js — Modern React Editor vs Classic Block Editor",
      description: "Compare Mina Rich Editor with Editor.js. React integration, TypeScript support, document structure, and maintenance compared side by side.",
      keywords: ["mina vs editor.js", "editor.js alternative", "block editor comparison", "react block editor"],
    },
  },

  novel: {
    slug: "novel",
    name: "Novel",
    tagline: "Notion-style WYSIWYG editor with AI autocomplete",
    website: "https://novel.sh",
    github: "https://github.com/steven-tey/novel",
    stats: {
      stars: "16.1k",
      bundleSize: "~100KB",
      license: "MIT",
      lastUpdate: "Stale (Feb 2025)",
      framework: "React",
    },
    features: [
      { category: "Active development", mina: "Yes", competitor: "Stale since Feb 2025", minaWins: true },
      { category: "AI provider", mina: "Any provider", competitor: "OpenAI only", minaWins: true },
      { category: "Block types", mina: "12+ types", competitor: "~8 types", minaWins: true },
      { category: "Editor variants", mina: "Full + Compact", competitor: "Single variant", minaWins: true },
      { category: "Export formats", mina: "HTML, JSON, MD", competitor: "HTML, JSON", minaWins: true },
      { category: "Aesthetics", mina: "Clean", competitor: "Beautiful", minaWins: false },
      { category: "AI integration", mina: "Built-in, any provider", competitor: "OpenAI only", minaWins: true },
      { category: "Vercel ecosystem", mina: "Independent", competitor: "Native", minaWins: false },
      { category: "Community", mina: "New", competitor: "16.1k stars", minaWins: false },
      { category: "Bundle size", mina: "~45KB", competitor: "~100KB", minaWins: true },
    ],
    minaWins: [
      "Active development — Novel has been stale since February 2025",
      "Provider-agnostic AI — use OpenAI, Anthropic, or any LLM",
      "More block types and richer editing features",
      "Two editor variants for different use cases",
      "More export formats including Markdown",
      "Smaller bundle size (~45KB vs ~100KB)",
    ],
    competitorWins: [
      "Beautiful default aesthetics and design",
      "OpenAI autocomplete deeply integrated as a core feature",
      "Vercel ecosystem — easy deployment with Next.js",
      "VSCode extension for local editing",
      "Larger community with 16.1k stars",
    ],
    codeComparison: {
      minaCode,
      competitorCode: `import { Editor } from 'novel'
import { defaultExtensions } from 'novel/extensions'
import { defaultEditorContent } from './content'
import 'novel/styles.css'

function App() {
  return (
    <Editor
      defaultValue={defaultEditorContent}
      extensions={defaultExtensions}
      completionApi="/api/generate"
      onUpdate={(editor) => {
        save(editor?.getJSON())
      }}
      className="min-h-[500px]"
    />
  )
}`,
      minaLines: 9,
      competitorLines: 17,
    },
    verdict: {
      chooseMina: [
        "You need an actively maintained editor",
        "You want AI features with any provider, not just OpenAI",
        "You need multiple editor variants (full page + compact)",
        "You want a smaller bundle size",
      ],
      chooseCompetitor: [
        "You want the most beautiful default design",
        "You're building exclusively with OpenAI + Vercel",
        "You want a VSCode extension for editing",
        "You don't mind that development has stalled",
      ],
    },
    seo: {
      title: "Mina vs Novel — Active Development vs Beautiful Design",
      description: "Compare Mina Rich Editor with Novel. Active maintenance, AI provider flexibility, block types, and bundle size compared honestly.",
      keywords: ["mina vs novel", "novel editor alternative", "notion-style editor", "react wysiwyg editor"],
    },
  },

  quill: {
    slug: "quill",
    name: "Quill",
    tagline: "Your powerful rich text editor",
    website: "https://quilljs.com",
    github: "https://github.com/slab/quill",
    stats: {
      stars: "47k",
      bundleSize: "~60KB",
      license: "MIT",
      lastUpdate: "Medium activity",
      framework: "Vanilla JS",
    },
    features: [
      { category: "Architecture", mina: "Block-based", competitor: "Traditional WYSIWYG", minaWins: true },
      { category: "Document model", mina: "Tree with nesting", competitor: "Flat Delta format", minaWins: true },
      { category: "Drag & drop blocks", mina: "Built-in", competitor: "Not supported", minaWins: true },
      { category: "Collaboration support", mina: "Coming soon", competitor: "Limited", minaWins: null },
      { category: "Modern React", mina: "Native", competitor: "Wrapper needed", minaWins: true },
      { category: "Slash commands", mina: "Built-in", competitor: "Not available", minaWins: true },
      { category: "AI integration", mina: "Built-in, any provider", competitor: "Not available", minaWins: true },
      { category: "Real-time collaboration", mina: "Built-in (Y.js)", competitor: "Limited", minaWins: true },
      { category: "Community size", mina: "New", competitor: "47k stars", minaWins: false },
      { category: "Adoption", mina: "Growing", competitor: "282k dependents", minaWins: false },
      { category: "Themes", mina: "CSS variables", competitor: "Snow + Bubble themes", minaWins: null },
      { category: "Framework support", mina: "React only", competitor: "Multi-framework", minaWins: false },
    ],
    minaWins: [
      "Block-based architecture vs traditional WYSIWYG",
      "Modern tree-based document model with nesting",
      "Built-in AI generation — provider-agnostic, any LLM",
      "Built-in Y.js real-time collaboration",
      "Built-in drag & drop for block reordering",
      "Native React integration without wrappers",
      "Slash commands and markdown shortcuts",
      "Modern TypeScript-first codebase",
    ],
    competitorWins: [
      "Highest adoption of any editor — 47k stars, 282k dependents",
      "Multiple themes (Snow, Bubble) for different aesthetics",
      "Battle-tested across thousands of production apps",
      "Multi-framework support (React, Vue, Angular wrappers)",
      "Extremely well-documented with years of community resources",
    ],
    codeComparison: {
      minaCode,
      competitorCode: `import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean'],
    ],
  },
})

quill.on('text-change', () => {
  save(quill.getContents())
})`,
      minaLines: 9,
      competitorLines: 19,
    },
    verdict: {
      chooseMina: [
        "You want block-based editing (not traditional WYSIWYG)",
        "You're building a modern React application",
        "You need drag & drop, slash commands, and markdown shortcuts",
        "You want a modern TypeScript-first editor",
      ],
      chooseCompetitor: [
        "You need the most battle-tested editor available",
        "You're working with non-React frameworks",
        "You need traditional WYSIWYG (not block-based)",
        "You want maximum community support and documentation",
      ],
    },
    seo: {
      title: "Mina vs Quill — Block Editor vs Classic WYSIWYG",
      description: "Compare Mina Rich Editor with Quill. Block-based vs traditional WYSIWYG, React integration, modern features, and community size compared.",
      keywords: ["mina vs quill", "quill alternative", "block editor vs wysiwyg", "modern react editor"],
    },
  },
};

export const competitorSlugs = Object.keys(competitors);
