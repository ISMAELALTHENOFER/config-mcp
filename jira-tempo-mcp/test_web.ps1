try {
  $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/my-tasks?maxResults=1' -UseBasicParsing
  Write-Host ("Status: " + $response.StatusCode)
  $content = $response.Content
  if ($content.Length -gt 200) { $content = $content.Substring(0, 200) + "..." }
  Write-Host ("Response: " + $content)
} catch {
  Write-Host ("Error: " + $_.Exception.Message)
}
