import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { Textarea, Input, Button } from "@/components/ui";
import { FileUploader, Loader } from "@/components/shared";
import { useUserContext } from "@/context/AuthContext";
import { useCreateGroup } from "@/lib/react-query/queries";

const GroupValidation = z.object({
  name: z.string().min(1, { message: "Group name is required" }).max(50, { message: "Maximum 50 characters" }),
  description: z.string().max(200, { message: "Maximum 200 characters" }).optional(),
  file: z.custom<File[]>().optional(),
});

type GroupFormValues = z.infer<typeof GroupValidation>;

const CreateGroup = () => {
  console.log("🎯 CreateGroup component rendered");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserContext();
  const { mutateAsync: createGroup, isLoading: isLoadingCreate } = useCreateGroup();
  
  console.log("🔧 CreateGroup hook loaded, isLoading:", isLoadingCreate);

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(GroupValidation),
    defaultValues: {
      name: "",
      description: "",
      file: [],
    },
  });

  // Handler
  const handleSubmit = async (value: GroupFormValues) => {
    console.log("🎯 Form submitted with values:", value);
    try {
      await createGroup({
        ...value,
        adminId: user.id,
        isPrivate: true,
      });

      toast({
        title: "Group created successfully!",
        description: "Your group has been created and you are now the admin.",
      });
      
      navigate("/groups");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-1">
      <div className="common-container">
        <div className="flex-start gap-3 justify-start w-full max-w-5xl">
          <img
            src="/assets/icons/gallery-add.svg"
            width={36}
            height={36}
            alt="add"
            className="invert-white"
          />
          <h2 className="h3-bold md:h2-bold text-left w-full">Create Group</h2>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-7 w-full mt-4 max-w-5xl">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Group Name</FormLabel>
                  <FormControl>
                    <Input type="text" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="shad-textarea custom-scrollbar"
                      {...field}
                      placeholder="Tell others about your group..."
                    />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Add Group Photo (Optional)</FormLabel>
                  <FormControl>
                    <FileUploader
                      fieldChange={field.onChange}
                      mediaUrl=""
                    />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            <div className="bg-dark-3 p-4 rounded-lg">
              <h3 className="base-medium text-light-1 mb-2">Privacy Settings</h3>
              <p className="small-regular text-light-3 mb-3">
                Your group will be private by default. This means:
              </p>
              <ul className="text-light-3 small-regular space-y-1 ml-4">
                <li>• Only members can see and create posts</li>
                <li>• Users need to request to join</li>
                <li>• You can approve or reject join requests</li>
                <li>• Group content is not visible to non-members</li>
              </ul>
            </div>

            <div className="flex gap-4 items-center justify-end">
              <Button
                type="button"
                className="shad-button_dark_4"
                onClick={() => navigate("/groups")}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="shad-button_primary whitespace-nowrap"
                disabled={isLoadingCreate}
                onClick={() => console.log("🎯 Submit button clicked")}>
                {isLoadingCreate && <Loader />}
                Create Group
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateGroup;