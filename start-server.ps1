$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "服务器正在运行: http://localhost:8080"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $filePath = Join-Path "D:\半舟呦鹿鸣品牌策划\00网站\YLM_wangzhan\dist" ($request.Url.LocalPath -replace "^/", "")
    
    if ($filePath -eq "D:\半舟呦鹿鸣品牌策划\00网站\YLM_wangzhan\dist") {
        $filePath = Join-Path $filePath "index.html"
    }
    
    if (Test-Path $filePath -PathType Leaf) {
        try {
            $content = Get-Content $filePath -Raw
            $response.ContentLength64 = [System.Text.Encoding]::UTF8.GetByteCount($content)
            
            if ($filePath -like "*.html") {
                $response.ContentType = "text/html"
            } elseif ($filePath -like "*.css") {
                $response.ContentType = "text/css"
            } elseif ($filePath -like "*.js") {
                $response.ContentType = "application/javascript"
            } elseif ($filePath -like "*.svg") {
                $response.ContentType = "image/svg+xml"
            }
            
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } catch {
            $response.StatusCode = 500
        }
    } else {
        $response.StatusCode = 404
    }
    
    $response.Close()
}
