// imports
import Dropzone from '@/components/dropzone';

export default function Home() {
  return (
      <div className="space-y-16 pb-8">
          {/* Title + Desc */}
          <div className="space-y-6">
              <h1 className="text-3xl md:text-5xl font-medium text-center">Free Unlimited File Converter</h1>
              <p className="text-muted-foreground text-md md:text-lg text-center md:px-24 xl:px-44 2xl:px-52">
              A web-based file conversion web application allows users to upload files 
              in various formats (such as images, videos, documents, or audio files)
              and convert them to different formats. Users can choose the desired output
              format, and the app processes the conversion, providing the converted file for download or preview. The app’s clean interface guides users through the process, ensuring a seamless experience. 
              </p>
          </div>

          {/* Upload Box */}
          <Dropzone />
      </div>
  );
}
