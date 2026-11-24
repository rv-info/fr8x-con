param(
    [Parameter(Mandatory=$true)]
    [string]$DocxPath,
    
    [Parameter(Mandatory=$true)]
    [string]$PdfPath
)

$word = $null
$doc = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $doc = $word.Documents.Open($DocxPath)
    # 17 represents wdExportFormatPDF in Word COM
    $doc.SaveAs([ref]$PdfPath, [ref]17)
    Write-Host "✓ Successfully converted $DocxPath to $PdfPath"
}
catch {
    Write-Error "Failed to convert DOCX to PDF: $_"
}
finally {
    if ($doc) {
        $doc.Close([ref]0) # wdDoNotSaveChanges
    }
    if ($word) {
        $word.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    }
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
