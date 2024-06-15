import { spawnSync } from "node:child_process"
// Function to get the list of repositories owned by the organization
async function getRepositories() {
  const response = await fetch(
    "https://registry.npmjs.org/-/org/tscircuit/package"
  )
  const data = await response.json()
  return Object.keys(data).map((k) =>
    k === "@tscircuit/kicad-mod-converter" ? "kicad-mod-converter" : k
  )
}

// Function to get the latest version of a package
async function getLatestVersion(packageName: string) {
  const response = await fetch(`https://registry.npmjs.org/${packageName}`)
  const data = await response.json()
  const latestVersion = data["dist-tags"].latest
  const lastPublishedAt = new Date(data.time[latestVersion])
  return { version: latestVersion, publishedAt: lastPublishedAt }
}

// Function to send a macOS notification
function sendNotification(packageName: string, version: string) {
  const script = `display notification "New version ${version} of ${packageName} is published" with title "NPM Package Update"`
  spawnSync("osascript", ["-e", script])
}

// Main function to initialize and start polling
async function main() {
  const repositories = await getRepositories()
  const latestVersions: {
    [key: string]: { version: string; publishedAt: Date }
  } = {}
  console.log("Repositories:", repositories.join(","))

  console.log("Getting most recent versions...")
  // Initialize the latest versions
  for (const repo of repositories) {
    latestVersions[repo] = await getLatestVersion(repo)
  }

  console.table(latestVersions)

  console.log("Polling every 30s for new versions...")

  // Polling every 30 seconds
  setInterval(async () => {
    for (const repo of repositories) {
      const latestVersion = await getLatestVersion(repo)
      if (latestVersion.version !== latestVersions[repo].version) {
        console.log(
          `New version ${latestVersion.version} of ${repo} was published`
        )
        sendNotification(repo, latestVersion.version)
        latestVersions[repo] = latestVersion
      }
    }
  }, 30000)
}

// Run the main function
main().catch(console.error)
