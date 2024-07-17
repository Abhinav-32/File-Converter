"use client";

// imports
import { FiUploadCloud } from "react-icons/fi";
import { LuFileSymlink } from "react-icons/lu";
import { MdClose, MdDone } from "react-icons/md";  // Consolidate MdClose and MdDone imports here
import ReactDropzone from "react-dropzone";
import bytesToSize from "@/utils/bytes-to-size";
import fileToIcon from "@/utils/file-to-icon";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import compressFileName from "@/utils/compress-file-name";
import { Skeleton } from "@/components/ui/skeleton";
import convertFile from "@/utils/convert";
import { ImSpinner3 } from "react-icons/im";
import { Badge } from "@/components/ui/badge";
import { HiOutlineDownload } from "react-icons/hi";
import { BiError } from "react-icons/bi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import loadFfmpeg from "@/utils/load-ffmpeg";
import type { Action } from "@/types";
import { FFmpeg } from "@ffmpeg/ffmpeg";

const extensions = {
  image: [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    "ico",
    "tif",
    "tiff",
    "svg",
    "raw",
    "tga",
  ],
  video: [
    "mp4",
    "m4v",
    "mp4v",
    "3gp",
    "3g2",
    "avi",
    "mov",
    "wmv",
    "mkv",
    "flv",
    "ogv",
    "webm",
    "h264",
    "264",
    "hevc",
    "265",
  ],
  audio: ["mp3", "wav", "ogg", "aac", "wma", "flac", "m4a"],
};

export default function Dropzone() {
  // variables & hooks
  const { toast } = useToast();
  const [is_hover, setIsHover] = useState<boolean>(false);
  const [actions, setActions] = useState<Action[]>([]);
  const [is_ready, setIsReady] = useState<boolean>(false);
  const [files, setFiles] = useState<Array<any>>([]);
  const [is_loaded, setIsLoaded] = useState<boolean>(false);
  const [is_converting, setIsConverting] = useState<boolean>(false);
  const [is_done, setIsDone] = useState<boolean>(false);
  const ffmpegRef = useRef<any>(null);
  const [defaultValues, setDefaultValues] = useState<string>("video");
  const [selcted, setSelected] = useState<string>("...");
  const accepted_files = {
    "image/*": [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".bmp",
      ".webp",
      ".ico",
      ".tif",
      ".tiff",
      ".raw",
      ".tga",
    ],
    "audio/*": [],
    "video/*": [],
  };

  // functions
  const reset = () => {
    setIsDone(false);
    setActions([]);
    setFiles([]);
    setIsReady(false);
    setIsConverting(false);
  };
  const downloadAll = (): void => {
    for (let action of actions) {
      !action.is_error && download(action);
    }
  };
  const download = (action: Action) => {
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = action.url;
    a.download = action.output;

    document.body.appendChild(a);
    a.click();

    // Clean up after download
    URL.revokeObjectURL(action.url);
    document.body.removeChild(a);
  };
  const convert = async (): Promise<any> => {
    let tmp_actions = actions.map((elt) => ({
      ...elt,
      is_converting: true,
    }));
    setActions(tmp_actions);
    setIsConverting(true);
    for (let action of tmp_actions) {
      try {
        const { url, output } = await convertFile(ffmpegRef.current, action);
        tmp_actions = tmp_actions.map((elt) =>
          elt === action
            ? {
                ...elt,
                is_converted: true,
                is_converting: false,
                url,
                output,
              }
            : elt
        );
        setActions(tmp_actions);
      } catch (err) {
        tmp_actions = tmp_actions.map((elt) =>
          elt === action
            ? {
                ...elt,
                is_converted: false,
                is_converting: false,
                is_error: true,
              }
            : elt
        );
        setActions(tmp_actions);
      }
    }
    setIsDone(true);
    setIsConverting(false);
  };
  const handleUpload = (data: Array<any>): void => {
    handleExitHover();
    setFiles(data);
    const tmp: Action[] = [];
    data.forEach((file: any) => {
      const formData = new FormData();
      tmp.push({
        file_name: file.name,
        file_size: file.size,
        from: file.name.slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2),
        to: null,
        file_type: file.type,
        file,
        is_converted: false,
        is_converting: false,
        is_error: false,
      });
    });
    setActions(tmp);
  };
  const handleHover = (): void => setIsHover(true);
  const handleExitHover = (): void => setIsHover(false);
  const updateAction = (file_name: String, to: String) => {
    setActions(
      actions.map((action): Action => {
        if (action.file_name === file_name) {
          console.log("FOUND");
          return {
            ...action,
            to,
          };
        }

        return action;
      })
    );
  };
  const checkIsReady = (): void => {
    let tmp_is_ready = true;
    actions.forEach((action: Action) => {
      if (!action.to) tmp_is_ready = false;
    });
    setIsReady(tmp_is_ready);
  };
  const deleteAction = (action: Action): void => {
    setActions(actions.filter((elt) => elt !== action));
    setFiles(files.filter((elt) => elt.name !== action.file_name));
  };
  useEffect(() => {
    if (!actions.length) {
      setIsDone(false);
      setFiles([]);
      setIsReady(false);
      setIsConverting(false);
    } else checkIsReady();
  }, [actions]);
  useEffect(() => {
    load();
  }, []);
  const load = async () => {
    const ffmpeg_response: FFmpeg = await loadFfmpeg();
    ffmpegRef.current = ffmpeg_response;
    setIsLoaded(true);
  };

  // returns
  if (actions.length) {
    return (
      <div className="space-y-6">
        {actions.map((action: Action, i: any) => (
          <div
            key={i}
            className="w-full py-4 space-y-2 lg:py-0 relative cursor-pointer rounded-xl border h-fit lg:h-20 px-4 lg:px-10 flex flex-wrap lg:flex-nowrap items-center justify-between"
          >
            {!is_loaded && (
              <Skeleton className="h-full w-full -ml-10 cursor-progress absolute rounded-xl" />
            )}
            <div className="flex gap-4 items-center">
              <span className="text-2xl text-orange-600">
                {fileToIcon(action.file_type)}
              </span>
              <div className="flex items-center gap-1 w-96">
                <span className="text-md font-medium overflow-x-hidden">
                  {compressFileName(action.file_name)}
                </span>
                <span className="text-muted-foreground text-sm">
                  ({bytesToSize(action.file_size)})
                </span>
              </div>
            </div>

            {action.is_error ? (
              <Badge variant="destructive" className="flex gap-2">
                <span>Error Converting File</span>
                <BiError />
              </Badge>
            ) : action.is_converted ? (
              <Badge variant="default" className="flex gap-2 bg-green-500">
                <span>Done</span>
                <MdDone />
              </Badge>
            ) : action.is_converting ? (
              <Badge variant="default" className="flex gap-2">
                <span>Converting</span>
                <span className="animate-spin">
                  <ImSpinner3 />
                </span>
              </Badge>
            ) : (
              <div className="flex flex-wrap gap-4 items-center">
                <Select
                  defaultValue={"Choose"}
                  onValueChange={(e: string) =>
                    updateAction(action.file_name, e)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Convert to" />
                  </SelectTrigger>
                  <SelectContent>
                    {extensions[
                      action.file_type.includes("image")
                        ? "image"
                        : action.file_type.includes("video")
                        ? "video"
                        : "audio"
                    ].map((elt: any, i: any) => (
                      <SelectItem key={i} value={elt}>
                        {elt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  disabled={!action.to}
                  variant={"secondary"}
                  onClick={() => convert()}
                >
                  Convert
                </Button>
              </div>
            )}
            <MdClose
              onClick={() => deleteAction(action)}
              className="absolute top-2 right-2 text-xl cursor-pointer"
            />
          </div>
        ))}
        <div className="w-full flex items-center gap-2">
          <Button
            onClick={() => convert()}
            className="ml-auto"
            disabled={!is_ready}
          >
            Convert all
          </Button>
          <Button
            onClick={() => reset()}
            variant={"destructive"}
            className="bg-muted"
          >
            Cancel all
          </Button>
          {is_done && (
            <Button onClick={() => downloadAll()} variant={"secondary"}>
              Download all
            </Button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4">
      <ReactDropzone
        accept={accepted_files}
        onDrop={(data: any) => handleUpload(data)}
      >
        {({ getRootProps, getInputProps }) => (
          <section
            onMouseEnter={handleHover}
            onMouseLeave={handleExitHover}
            className="flex flex-col items-center justify-center w-full p-10 h-60 border border-dashed border-orange-600 text-orange-600 rounded-xl cursor-pointer"
          >
            <div
              className={`flex flex-col items-center gap-2 ${
                is_hover ? "text-orange-600/50" : ""
              }`}
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              <span className="text-4xl">
                <FiUploadCloud />
              </span>
              <p className="text-center text-lg font-medium">
                Drop files here, or{" "}
                <span className="underline">browse</span>
              </p>
              <em className="text-sm text-muted-foreground">
                (Only *.jpeg, *.png and *.jpg images will be accepted)
              </em>
            </div>
          </section>
        )}
      </ReactDropzone>
      <Tabs
        defaultValue={defaultValues}
        onValueChange={(value: any) => setDefaultValues(value)}
        className="w-full"
      >
        <TabsList className="w-full">
          <TabsTrigger
            value="video"
            className="w-full data-[state=active]:bg-orange-600"
          >
            Video
          </TabsTrigger>
          <TabsTrigger
            value="image"
            className="w-full data-[state=active]:bg-orange-600"
          >
            Image
          </TabsTrigger>
          <TabsTrigger
            value="audio"
            className="w-full data-[state=active]:bg-orange-600"
          >
            Audio
          </TabsTrigger>
        </TabsList>
        <TabsContent value="video" className="w-full">
          <Select
            onValueChange={(value: any) => setSelected(value)}
            defaultValue={"Choose"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Convert to" />
            </SelectTrigger>
            <SelectContent>
              {extensions.video.map((elt: any, i: any) => (
                <SelectItem key={i} value={elt}>
                  {elt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TabsContent>
        <TabsContent value="image" className="w-full">
          <Select
            onValueChange={(value: any) => setSelected(value)}
            defaultValue={"Choose"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Convert to" />
            </SelectTrigger>
            <SelectContent>
              {extensions.image.map((elt: any, i: any) => (
                <SelectItem key={i} value={elt}>
                  {elt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TabsContent>
        <TabsContent value="audio" className="w-full">
          <Select
            onValueChange={(value: any) => setSelected(value)}
            defaultValue={"Choose"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Convert to" />
            </SelectTrigger>
            <SelectContent>
              {extensions.audio.map((elt: any, i: any) => (
                <SelectItem key={i} value={elt}>
                  {elt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TabsContent>
      </Tabs>
    </div>
  );
}
