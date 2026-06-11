import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCreateRoom, useHealthCheck } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Keyboard, Plus, Activity } from "lucide-react";
import { useForm } from "react-hook-form";

export default function Home() {
  const [, setLocation] = useLocation();
  const createRoom = useCreateRoom();
  const { data: health, isLoading: isHealthLoading } = useHealthCheck();

  const joinForm = useForm({
    defaultValues: {
      roomId: "",
    },
  });

  const handleCreateRoom = () => {
    createRoom.mutate(
      { data: { name: "New Meeting" } },
      {
        onSuccess: (room) => {
          setLocation(`/room/${room.id}`);
        },
      }
    );
  };

  const onJoin = (data: { roomId: string }) => {
    if (data.roomId.trim()) {
      setLocation(`/room/${data.roomId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground selection:bg-primary/30">
      <header className="w-full p-6 flex justify-between items-center border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Video className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Intell Meet</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {isHealthLoading ? (
            <span className="flex items-center space-x-2"><Activity className="w-4 h-4 animate-pulse" /> <span>Connecting...</span></span>
          ) : (
            <span className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> <span>API Ready</span></span>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Secure, sharp <br /> <span className="text-primary">video meetings.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                The video conferencing tool built for teams that demand focus. 
                Fast to join, pristine quality, zero distractions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button 
                size="lg" 
                className="w-full sm:w-auto text-base px-8 h-14 rounded-full font-medium"
                onClick={handleCreateRoom}
                disabled={createRoom.isPending}
              >
                {createRoom.isPending ? (
                  <span className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>New meeting</span>
                  </span>
                )}
              </Button>

              <div className="w-full sm:w-auto flex items-center space-x-2 flex-1">
                <form onSubmit={joinForm.handleSubmit(onJoin)} className="flex items-center space-x-3 w-full relative">
                  <div className="relative flex-1">
                    <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      {...joinForm.register("roomId")}
                      placeholder="Enter a room code" 
                      className="pl-12 h-14 bg-card border-border rounded-full text-base focus-visible:ring-primary placeholder:text-muted-foreground w-full"
                    />
                  </div>
                  <Button type="submit" variant="secondary" size="lg" className="h-14 rounded-full px-6 font-medium shrink-0">
                    Join
                  </Button>
                </form>
              </div>
            </div>
            
            <div className="pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                By joining, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>

          <div className="hidden lg:block relative aspect-video rounded-2xl overflow-hidden bg-card border border-border shadow-2xl">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Video className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Your camera is off</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none mix-blend-overlay"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
