import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/shared/Loader";
import { useToast } from "@/components/ui/use-toast";

import { SigninValidation } from "@/lib/validation";
import { useSignInAccount } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";

const SigninForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();

  // Query
  const { mutateAsync: signInAccount, isLoading } = useSignInAccount();

  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignin = async (user: z.infer<typeof SigninValidation>) => {
    const session = await signInAccount(user);

    if (!session) {
      toast({ title: "Login failed. Please try again." });
      
      return;
    }

    const isLoggedIn = await checkAuthUser();

    if (isLoggedIn) {
      form.reset();

      navigate("/");
    } else {
      toast({ title: "Login failed. Please try again.", });
      
      return;
    }
  };

  return (
    <Form {...form}>
      <div className="w-full flex-center flex-col">
        {/* Logo with animation */}
        <div className="mb-6 transform transition-transform duration-300 hover:scale-105">
          <img src="/assets/images/cherry-logo.svg" alt="Cherry Club Logo" className="w-16 h-16 sm:w-20 sm:h-20" />
        </div>

        <h2 className="h3-bold sm:h2-bold text-center mb-2">
          Bienvenido de vuelta
        </h2>
        <p className="text-light-3 small-medium sm:base-regular text-center mb-6 px-2">
          Ingresa a Cherry Club
        </p>
        <form
          onSubmit={form.handleSubmit(handleSignin)}
          className="flex flex-col gap-4 w-full">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Email</FormLabel>
                <FormControl>
                  <Input type="text" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Password</FormLabel>
                <FormControl>
                  <Input type="password" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="shad-button_primary mt-2 h-12 text-base font-semibold rounded-xl">
            {isLoading || isUserLoading ? (
              <div className="flex-center gap-2">
                <Loader /> Entrando...
              </div>
            ) : (
              "Entrar"
            )}
          </Button>

          <div className="mt-6 text-center">
            <p className="text-small-regular text-light-2">
              ¿No tienes cuenta?{" "}
              <Link
                to="/sign-up"
                className="text-primary-500 text-small-semibold hover:text-primary-400 transition-colors">
                Regístrate
              </Link>
            </p>
          </div>
        </form>
      </div>
    </Form>
  );
};

export default SigninForm;
