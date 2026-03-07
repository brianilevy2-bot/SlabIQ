import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { MessageInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// Fetch all messages
export function useMessages() {
  return useQuery({
    queryKey: [api.messages.list.path],
    queryFn: async () => {
      const res = await fetch(api.messages.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      
      const data = await res.json();
      // Safely parse and log errors if backend structure mismatches
      const result = api.messages.list.responses[200].safeParse(data);
      if (!result.success) {
        console.error("[Zod] Validation failed for GET /api/messages:", result.error.format());
        throw new Error("Invalid response format from server");
      }
      return result.data;
    },
  });
}

// Create a new message
export function useCreateMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: MessageInput) => {
      // Validate input before sending
      const validated = api.messages.create.input.parse(data);
      
      const res = await fetch(api.messages.create.path, {
        method: api.messages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const errorData = await res.json();
          const parsedError = api.messages.create.responses[400].safeParse(errorData);
          throw new Error(parsedError.success ? parsedError.data.message : "Validation failed");
        }
        throw new Error("Failed to create message");
      }

      const responseData = await res.json();
      return api.messages.create.responses[201].parse(responseData);
    },
    onSuccess: () => {
      // Invalidate the list to trigger a refetch
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
