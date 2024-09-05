import React, { useState } from "react"
import { useWeb3StorageClient } from "../context/Web3StorageClientContext"
import { useFileUrl } from "../context/FileUrlContext"

const FileUploadForm = () => {
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState("") // Added state for fileName
  const { fileUrl, setFileUrl } = useFileUrl()
  const { client } = useWeb3StorageClient() // Use the client from context

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setFile(file)
      setFileName(file.name) // Set file name when a file is selected
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (file && client) {
      try {
        const files = [file]
        const directoryCid = await client.uploadDirectory(files)
        const url = `https://${directoryCid}.ipfs.w3s.link`
        setFileUrl(url)
        alert(`File uploaded successfully! Can be accessed at: ${url}`)
      } catch (error) {
        console.error("Error uploading file:", error)
        alert("Error uploading file. Please try again later.")
      }
    } else {
      alert("No file selected or client is not initialized.")
    }
  }

  return (
    <div className='max-w-md mx-auto mt-10'>
      <form
        onSubmit={handleSubmit}
        className='flex flex-col p-5 border border-gray-300 shadow-lg rounded-lg bg-white'
      >
        <label className='block text-sm font-medium text-gray-700 mb-3'>
          Upload certificate file issued by authorities:
        </label>
        <input
          type='file'
          onChange={handleFileChange}
          className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 mb-3'
        />
        {fileName && (
          <p className='text-gray-600 text-sm italic'>
            File selected: {fileName}
          </p>
        )}
        <button
          type='submit'
          disabled={!file}
          className='mt-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-300'
        >
          Upload
        </button>
      </form>
    </div>
  )
}

export default FileUploadForm
