import { useEffect, useState } from "react"
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion"
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronRight,
  Clipboard,
  Code2,
  Download,
  ExternalLink,
  FileKey2,
  FolderSync,
  Github,
  Menu,
  MonitorDown,
  Network,
  ShieldCheck,
  Sparkles,
  SplitSquareVertical,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const GITHUB_URL = "https://github.com/korvect/nauterm"
const RELEASE_URL = `${GITHUB_URL}/releases/latest`
const RELEASE_API_URL = "https://api.github.com/repos/korvect/nauterm/releases/latest"

type PlatformId = "macos" | "windows" | "linux"
type ArchitectureId = "arm64" | "x86_64"

type ReleaseAsset = {
  name: string
  browser_download_url: string
  size: number
}

type LatestRelease = {
  tag_name: string
  html_url: string
  assets: ReleaseAsset[]
}

const platformLabels: Record<PlatformId, string> = {
  macos: "macOS",
  windows: "Windows",
  linux: "Linux",
}

function detectPlatform(): PlatformId {
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes("win")) return "windows"
  if (userAgent.includes("linux")) return "linux"
  return "macos"
}

function defaultArchitecture(platform: PlatformId): ArchitectureId {
  return platform === "macos" ? "arm64" : "x86_64"
}

function findReleaseAsset(
  assets: ReleaseAsset[],
  platform: PlatformId,
  architecture: ArchitectureId,
) {
  const escapedArch = architecture.replace("_", "[_-]?")
  const suffix = platform === "macos"
    ? "dmg"
    : platform === "windows"
      ? "setup\\.exe"
      : "AppImage\\.tar\\.gz"
  const pattern = new RegExp(`${platform}-${escapedArch}.*${suffix}$`, "i")
  return assets.find((asset) => pattern.test(asset.name))
}

function findAssetBySuffix(
  assets: ReleaseAsset[],
  platform: PlatformId,
  architecture: ArchitectureId,
  suffix: RegExp,
) {
  const target = `${platform}-${architecture}`.toLowerCase()
  return assets.find(
    (asset) => asset.name.toLowerCase().includes(target) && suffix.test(asset.name),
  )
}

function downloadFormats(
  assets: ReleaseAsset[],
  platform: PlatformId,
  architecture: ArchitectureId,
) {
  const definitions = platform === "macos"
    ? [
        ["DMG", "Recommended installer", /\.dmg$/i],
        ["App bundle", "Portable ZIP", /\.app\.zip$/i],
      ] as const
    : platform === "windows"
      ? [
          ["Setup", "Windows installer", /-setup\.exe$/i],
          ["Portable", "ZIP archive", /\.zip$/i],
        ] as const
      : [
          ["AppImage", "Portable archive", /\.AppImage\.tar\.gz$/i],
          ["DEB", "Debian · Ubuntu", /\.deb$/i],
          ["RPM", "Fedora · RHEL", /\.rpm$/i],
        ] as const

  return definitions.map(([label, description, suffix]) => ({
    label,
    description,
    asset: findAssetBySuffix(assets, platform, architecture, suffix),
  }))
}

const workflows = [
  {
    id: "workspace",
    label: "Workspaces",
    title: "Many sessions. One calm surface.",
    body: "Group terminals into focused workspaces, split the canvas, and move between live sessions without losing context.",
    image: "/screenshots/workspace.png",
    note: "Multi-pane workspaces",
  },
  {
    id: "terminal",
    label: "Terminal",
    title: "A terminal that feels native.",
    body: "Local shells and remote sessions share a fast native core, searchable history, rich themes, and adaptive predictive echo.",
    image: "/screenshots/terminal.png",
    note: "Flutter interface · Rust core",
  },
  {
    id: "sftp",
    label: "SFTP",
    title: "Remote files, without the detour.",
    body: "Browse both sides at once, resume large transfers, and open remote files in the editor you already use.",
    image: "/screenshots/sftp.png",
    note: "Concurrent resumable transfers",
  },
] as const

const capabilities: Array<{
  number: string
  title: string
  body: string
  icon: LucideIcon
}> = [
  {
    number: "01",
    title: "Connect your way",
    body: "SSH, Mosh, Telnet, serial, local shells, proxies, and local or dynamic port forwarding.",
    icon: Network,
  },
  {
    number: "02",
    title: "Keep context close",
    body: "Saved hosts, reusable snippets, split panes, workspace navigation, and searchable shell history.",
    icon: SplitSquareVertical,
  },
  {
    number: "03",
    title: "Move files with confidence",
    body: "A dual-pane SFTP browser with concurrent, chunked, resumable transfers and editor handoff.",
    icon: FolderSync,
  },
  {
    number: "04",
    title: "Ask, review, then run",
    body: "Optional OpenAI, Anthropic, Gemini, or Ollama assistance drafts commands but never skips your review.",
    icon: Sparkles,
  },
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeWorkflow, setActiveWorkflow] = useState(0)
  const [copied, setCopied] = useState(false)
  const [platform, setPlatform] = useState<PlatformId>("macos")
  const [architecture, setArchitecture] = useState<ArchitectureId>("arm64")
  const [latestRelease, setLatestRelease] = useState<LatestRelease | null>(null)
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const heroImageY = useTransform(scrollYProgress, [0, 0.28], [0, 72])
  const heroImageScale = useTransform(scrollYProgress, [0, 0.24], [1, 0.96])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen])

  useEffect(() => {
    const detectedPlatform = detectPlatform()
    setPlatform(detectedPlatform)
    setArchitecture(defaultArchitecture(detectedPlatform))

    const controller = new AbortController()
    fetch(RELEASE_API_URL, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub returned ${response.status}`)
        return response.json() as Promise<LatestRelease>
      })
      .then(setLatestRelease)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        console.warn("Unable to load the latest Nauterm release", error)
      })

    return () => controller.abort()
  }, [])

  const copyInstallCommand = async () => {
    await navigator.clipboard.writeText("brew install --cask korvect/nauterm/nauterm")
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const selectedAsset = latestRelease
    ? findReleaseAsset(latestRelease.assets, platform, architecture)
    : undefined

  const selectPlatform = (nextPlatform: PlatformId) => {
    setPlatform(nextPlatform)
    setArchitecture(defaultArchitecture(nextPlatform))
  }

  return (
    <div className="min-h-screen overflow-clip bg-[#0b0c0c] text-[#f2f1eb] selection:bg-[#efae3e] selection:text-[#17130b]">
      <Header
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        downloadUrl={selectedAsset?.browser_download_url}
        platform={platform}
      />

      <main>
        <section className="hero-grid relative min-h-[100svh] overflow-hidden border-b border-white/10 px-5 pb-16 pt-28 sm:px-8 lg:px-12 lg:pb-24 lg:pt-32">
          <div className="hero-glow" aria-hidden="true" />
          <div className="mx-auto flex min-h-[calc(100svh-11rem)] max-w-[1500px] flex-col justify-between">
            <div className="hero-copy-grid relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="hero-eyebrow flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#efae3e]"
              >
                <span className="size-2 rounded-full bg-[#efae3e] shadow-[0_0_18px_#efae3e]" />
                Built for macOS, Linux & Windows
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="hero-wordmark brand-wordmark"
              >
                NAUTERM
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.65 }}
                className="hero-copy max-w-md lg:justify-self-end"
              >
                <h1 className="text-balance text-3xl font-medium leading-[1.08] tracking-[-0.045em] sm:text-4xl">
                  Your remote workspace,
                  <span className="text-white/45"> under your control.</span>
                </h1>
                <p className="mt-5 max-w-sm text-pretty text-[15px] leading-7 text-white/55">
                  Terminal, remote access, file transfer, encrypted sync, and optional AI assistance—built as one native desktop workspace.
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  <Button size="lg" className="h-14 w-full px-8 text-base" asChild>
                    <a href={selectedAsset?.browser_download_url ?? RELEASE_URL}>
                      <Download /> Download for {platformLabels[platform]}
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 w-full px-8 text-base" asChild>
                    <a href={latestRelease?.html_url ?? RELEASE_URL} target="_blank" rel="noreferrer">
                      <Github /> View releases
                    </a>
                  </Button>
                </div>
              </motion.div>
            </div>

            <motion.div
              style={
                shouldReduceMotion
                  ? undefined
                  : { y: heroImageY, scale: heroImageScale }
              }
              initial={{ opacity: 0, y: 60, rotateX: 6 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.34, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 mx-auto mt-14 w-full max-w-[1040px] origin-top lg:mt-16"
            >
              <ProductFrame
                image="/screenshots/workspace.png"
                alt="Nauterm workspace with multiple terminal sessions"
                className="shadow-[0_45px_120px_rgba(0,0,0,.52)]"
              />
              <div className="absolute -bottom-7 left-[8%] hidden items-center gap-3 rounded-full border border-white/10 bg-[#121313]/90 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/55 shadow-2xl backdrop-blur-xl sm:flex">
                <span className="text-[#56d69a]">admin@production</span>
                <span className="text-white/20">~</span>
                <span>5 sessions live</span>
                <span className="inline-block h-3 w-1.5 animate-cursor-blink bg-[#efae3e]" />
              </div>
            </motion.div>
          </div>

          <a
            href="#product"
            className="absolute bottom-6 right-6 z-20 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-white lg:flex"
          >
            Explore <ArrowDown className="size-3.5" />
          </a>
        </section>

        <section className="border-b border-[#1d1e1d] bg-[#efeee7] text-[#11120f]">
          <div className="mx-auto grid max-w-[1500px] grid-cols-2 divide-x divide-[#171815]/10 lg:grid-cols-4">
            {[
              ["Native core", "Flutter + Rust"],
              ["Connections", "SSH · Mosh · Serial"],
              ["Local data", "SQLCipher encrypted"],
              ["License", "Source available"],
            ].map(([title, value], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{ delay: index * 0.07 }}
                className="px-5 py-7 sm:px-8 lg:py-9"
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-black/40">
                  {title}
                </p>
                <p className="mt-2 text-sm font-semibold tracking-[-0.02em] sm:text-base">
                  {value}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <DownloadSection
          architecture={architecture}
          copied={copied}
          latestRelease={latestRelease}
          onArchitectureChange={setArchitecture}
          onCopyInstallCommand={copyInstallCommand}
          onPlatformChange={selectPlatform}
          platform={platform}
        />

        <section id="product" className="bg-[#efeee7] px-5 py-24 text-[#11120f] sm:px-8 lg:px-12 lg:py-36">
          <div className="mx-auto max-w-[1500px]">
            <SectionIntro
              eyebrow="One working surface"
              title="Less window management. More actual work."
              copy="Nauterm keeps the tools around a remote session together, so context survives every switch."
              dark={false}
            />

            <div className="mt-16 grid items-start gap-10 lg:mt-24 lg:grid-cols-[330px_minmax(0,1fr)] lg:gap-20">
              <div className="space-y-1 lg:sticky lg:top-28">
                {workflows.map((workflow, index) => (
                  <button
                    key={workflow.id}
                    onClick={() => setActiveWorkflow(index)}
                    className={cn(
                      "group w-full border-t border-black/15 py-6 text-left transition-opacity last:border-b",
                      activeWorkflow === index ? "opacity-100" : "opacity-45 hover:opacity-75",
                    )}
                  >
                    <div className="flex items-center justify-between gap-5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                        0{index + 1} / {workflow.label}
                      </span>
                      <ChevronRight
                        className={cn(
                          "size-4 transition-transform",
                          activeWorkflow === index && "translate-x-1",
                        )}
                      />
                    </div>
                    <AnimatePresence initial={false}>
                      {activeWorkflow === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <h3 className="pt-6 text-2xl font-semibold leading-tight tracking-[-0.04em]">
                            {workflow.title}
                          </h3>
                          <p className="pt-4 text-sm leading-6 text-black/55">
                            {workflow.body}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                ))}
              </div>

              <div className="min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={workflows[activeWorkflow].id}
                    initial={{ opacity: 0, y: 18, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.99 }}
                    transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ProductFrame
                      image={workflows[activeWorkflow].image}
                      alt={workflows[activeWorkflow].title}
                      light
                    />
                    <div className="mt-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-black/40">
                      <span>Actual product interface</span>
                      <span>{workflows[activeWorkflow].note}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-white/10 bg-[#0b0c0c] px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
          <div className="mx-auto max-w-[1500px]">
            <SectionIntro
              eyebrow="Built for daily operations"
              title="Everything around the prompt, considered."
              copy="A focused toolkit for people who live between local machines, servers, and files."
            />

            <div className="mt-16 border-t border-white/15 lg:mt-24">
              {capabilities.map((capability, index) => {
                const Icon = capability.icon
                return (
                  <motion.div
                    key={capability.number}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.55 }}
                    transition={{ duration: 0.5, delay: index * 0.04 }}
                    className="group grid gap-5 border-b border-white/15 py-8 transition-colors hover:bg-white/[.025] sm:grid-cols-[80px_1fr_1fr_48px] sm:items-center lg:py-10"
                  >
                    <span className="font-mono text-[10px] tracking-[0.2em] text-[#efae3e]">
                      {capability.number}
                    </span>
                    <h3 className="text-xl font-semibold tracking-[-0.035em] sm:text-2xl">
                      {capability.title}
                    </h3>
                    <p className="max-w-xl text-sm leading-6 text-white/48">
                      {capability.body}
                    </p>
                    <Icon className="hidden size-5 text-white/25 transition-all group-hover:translate-x-1 group-hover:text-[#efae3e] sm:block" />
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="security" className="security-grid relative overflow-hidden bg-[#16251f] px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
          <div className="mx-auto grid max-w-[1500px] gap-16 lg:grid-cols-[1.05fr_.95fr] lg:gap-28">
            <div>
              <div className="flex size-12 items-center justify-center rounded-full border border-[#9de7bd]/25 bg-[#9de7bd]/10">
                <ShieldCheck className="size-5 text-[#9de7bd]" />
              </div>
              <h2 className="mt-8 max-w-2xl text-balance text-5xl font-medium leading-[.96] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                Your keys stay yours.
              </h2>
              <p className="mt-7 max-w-xl text-pretty text-base leading-7 text-[#d7f0e1]/58">
                Nauterm is designed around encrypted local storage and provider-independent sync—not an account you have to trust forever.
              </p>
            </div>

            <div className="self-end border-t border-[#d7f0e1]/18">
              {[
                [FileKey2, "Encrypted at rest", "Credentials and connection data live in a SQLCipher database; the random key stays in your system credential store."],
                [FolderSync, "Encrypted before sync", "Cloud providers receive encrypted payloads. Your Master Key wraps the random sync key and is never persisted."],
                [Code2, "Source you can inspect", "The desktop interface, native core, database migrations, and transport integrations are available to review."],
              ].map(([Icon, title, body]) => {
                const FeatureIcon = Icon as LucideIcon
                return (
                  <div key={title as string} className="grid grid-cols-[42px_1fr] gap-4 border-b border-[#d7f0e1]/18 py-6">
                    <FeatureIcon className="mt-1 size-5 text-[#9de7bd]" />
                    <div>
                      <h3 className="font-semibold tracking-[-0.025em]">{title as string}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#d7f0e1]/52">{body as string}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="open-source" className="relative overflow-hidden border-t border-white/10 bg-[#0b0c0c] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="open-source-orbit" aria-hidden="true" />
          <div className="relative z-10 mx-auto flex max-w-[1500px] flex-col items-start justify-between gap-12 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#efae3e]">
                Built in the open
              </p>
              <h2 className="mt-6 max-w-4xl text-balance text-5xl font-medium leading-[.96] tracking-[-0.06em] sm:text-7xl lg:text-8xl">
                Make your terminal workspace yours.
              </h2>
            </div>
            <Button size="lg" variant="light" asChild>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                Star on GitHub <ArrowRight />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function DownloadSection({
  architecture,
  copied,
  latestRelease,
  onArchitectureChange,
  onCopyInstallCommand,
  onPlatformChange,
  platform,
}: {
  architecture: ArchitectureId
  copied: boolean
  latestRelease: LatestRelease | null
  onArchitectureChange: (architecture: ArchitectureId) => void
  onCopyInstallCommand: () => void
  onPlatformChange: (platform: PlatformId) => void
  platform: PlatformId
}) {
  const formats = downloadFormats(
    latestRelease?.assets ?? [],
    platform,
    architecture,
  )

  return (
    <section id="download" className="border-b border-black/10 bg-[#efeee7] px-5 py-20 text-[#11120f] sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,.85fr)_minmax(500px,1fr)] lg:items-end lg:gap-24">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/45">
              Get Nauterm
            </p>
            <h2 className="mt-6 max-w-3xl text-balance text-5xl font-medium leading-[.98] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Ready when your next connection is.
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-6 text-black/48">
              Choose your operating system and processor. The download starts directly from the latest verified GitHub release.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-black/40">
              <MonitorDown className="size-3.5" /> Direct download
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-black/65">Operating system</p>
              <div className="grid grid-cols-3 gap-2" aria-label="Choose operating system">
                {(["macos", "windows", "linux"] as PlatformId[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onPlatformChange(item)}
                    aria-pressed={platform === item}
                    className={cn(
                      "rounded-lg border px-2 py-3 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b96f13] sm:px-3 sm:text-xs",
                      platform === item
                        ? "border-black bg-[#121310] text-white"
                        : "border-black/15 bg-transparent text-black/55 hover:border-black/35 hover:text-black",
                    )}
                  >
                    {platformLabels[item]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold text-black/65">Architecture</p>
              <div className="grid grid-cols-2 gap-2" aria-label="Choose processor architecture">
                {(["arm64", "x86_64"] as ArchitectureId[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onArchitectureChange(item)}
                    aria-pressed={architecture === item}
                    className={cn(
                      "rounded-lg border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b96f13]",
                      architecture === item
                        ? "border-[#b96f13] bg-[#efae3e]/12"
                        : "border-black/15 hover:border-black/35",
                    )}
                  >
                    <span className="block text-xs font-semibold">
                      {item === "arm64"
                        ? platform === "macos" ? "Apple silicon" : "ARM64"
                        : platform === "macos" ? "Intel" : "x64"}
                    </span>
                    <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.12em] text-black/38">
                      {item}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <p className="mb-2 text-xs font-semibold text-black/65">Package format</p>
              <div className={cn("grid gap-2", formats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
                {formats.map(({ label, description, asset }) => (
                  <a
                    key={label}
                    href={asset?.browser_download_url ?? RELEASE_URL}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-black/15 bg-[#121310] px-4 py-3 text-white transition-colors hover:bg-[#25261f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b96f13]"
                  >
                    <span>
                      <span className="block text-xs font-semibold">{label}</span>
                      <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-white/38">{description}</span>
                    </span>
                    <Download className="size-4 shrink-0 text-[#efae3e] transition-transform group-hover:translate-y-0.5" />
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button size="lg" variant="outline" className="border-black/20 bg-transparent text-black hover:border-black/40 hover:bg-black/[.04]" asChild>
                <a href={latestRelease?.html_url ?? RELEASE_URL} target="_blank" rel="noreferrer">
                  GitHub Releases <ExternalLink />
                </a>
              </Button>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-black/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-black/45">
                {latestRelease ? `${latestRelease.tag_name} is the latest release.` : "Checking the latest release…"} SHA-256 checksums included.
              </p>
              <button
                onClick={onCopyInstallCommand}
                className="flex shrink-0 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-black/45 transition-colors hover:text-black"
                aria-label="Copy Homebrew installation command"
              >
                {copied ? <Check className="size-3.5 text-[#25885c]" /> : <Clipboard className="size-3.5" />}
                {copied ? "Copied Homebrew command" : "Copy Homebrew command"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Header({
  menuOpen,
  setMenuOpen,
  downloadUrl,
  platform,
}: {
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  downloadUrl?: string
  platform: PlatformId
}) {
  const nav = [
    ["Product", "#product"],
    ["Features", "#features"],
    ["Security", "#security"],
    ["Download", "#download"],
  ]

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0b0c0c]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <a href="#" className="flex items-center gap-3" aria-label="Nauterm home">
          <img src="/brand/app-icon.png" alt="" className="size-9 rounded-[10px]" />
          <span className="text-[15px] font-bold tracking-[-0.035em]">Nauterm</span>
          <span className="hidden border-l border-white/15 pl-3 font-mono text-[9px] uppercase tracking-[0.18em] text-white/35 sm:block">
            Remote workspace
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {nav.map(([label, href]) => (
            <a key={href} href={href} className="rounded-full px-4 py-2 text-xs font-medium text-white/58 transition-colors hover:bg-white/[.06] hover:text-white">
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <Github /> GitHub
            </a>
          </Button>
          <Button size="sm" asChild>
            <a href={downloadUrl ?? RELEASE_URL}>Get for {platformLabels[platform]} <ArrowRight /></a>
          </Button>
        </div>

        <button
          className="flex size-10 items-center justify-center rounded-full border border-white/12 text-white md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "calc(100svh - 5rem)" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/10 bg-[#0b0c0c] md:hidden"
          >
            <nav className="flex h-full flex-col px-5 py-8">
              {nav.map(([label, href], index) => (
                <motion.a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between border-b border-white/10 py-5 text-2xl font-medium tracking-[-0.04em]"
                >
                  {label} <ArrowRight className="size-5 text-white/35" />
                </motion.a>
              ))}
              <div className="mt-auto flex gap-3 pt-8">
                <Button className="flex-1" asChild><a href={downloadUrl ?? RELEASE_URL}>Download</a></Button>
                <Button variant="outline" className="flex-1" asChild><a href={GITHUB_URL}>GitHub</a></Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function ProductFrame({
  image,
  alt,
  className,
  light = false,
}: {
  image: string
  alt: string
  className?: string
  light?: boolean
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[18px] border p-1.5 sm:rounded-[24px] sm:p-2",
        light
          ? "border-black/10 bg-black/[.055] shadow-[0_28px_80px_rgba(29,28,23,.15)]"
          : "border-white/10 bg-white/[.055]",
        className,
      )}
    >
      <div className="overflow-hidden rounded-[13px] bg-black sm:rounded-[17px]">
        <img src={image} alt={alt} className="block h-auto w-full" loading="eager" />
      </div>
    </div>
  )
}

function SectionIntro({
  eyebrow,
  title,
  copy,
  dark = true,
}: {
  eyebrow: string
  title: string
  copy: string
  dark?: boolean
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-24">
      <div>
        <p className={cn("font-mono text-[10px] uppercase tracking-[0.22em]", dark ? "text-[#efae3e]" : "text-black/45")}>{eyebrow}</p>
        <h2 className="mt-6 max-w-4xl text-balance text-5xl font-medium leading-[.98] tracking-[-0.06em] sm:text-6xl lg:text-7xl">{title}</h2>
      </div>
      <p className={cn("max-w-lg text-pretty text-base leading-7", dark ? "text-white/48" : "text-black/52")}>{copy}</p>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#090a09] px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <img src="/brand/app-icon.png" alt="" className="size-8 rounded-[9px]" />
            <span className="font-semibold">Nauterm</span>
          </div>
          <p className="mt-4 max-w-sm text-xs leading-5 text-white/36">
            A modern terminal and remote access workspace built with Flutter and Rust.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/42">
          <a href={GITHUB_URL} className="transition-colors hover:text-white">GitHub</a>
          <a href={`${GITHUB_URL}/releases`} className="transition-colors hover:text-white">Releases</a>
          <a href={`${GITHUB_URL}/issues`} className="transition-colors hover:text-white">Issues</a>
          <a href={`${GITHUB_URL}/blob/main/LICENSE`} className="transition-colors hover:text-white">License</a>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-[1500px] items-center justify-between border-t border-white/10 pt-6 font-mono text-[9px] uppercase tracking-[0.14em] text-white/25">
        <span>© {new Date().getFullYear()} Korvect</span>
        <span className="flex items-center gap-2"><Zap className="size-3 text-[#efae3e]" /> Built for the command line</span>
      </div>
    </footer>
  )
}

export default App
