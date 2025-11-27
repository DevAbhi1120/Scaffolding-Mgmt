import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select.tsx";
import FileInput from "../form/input/FileInput";
import { BASE_URL, BASE_IMAGE_URL } from "../BaseUrl/config";
import { Facebook, Instagram, Linkedin, Pencil } from "lucide-react";

interface Props {
  user: any;
  onUpdated?: () => void;
}

export default function UserMetaCard({ user, onUpdated }: Props) {
  const { isOpen, openModal, closeModal } = useModal();
  const [formData, setFormData] = useState<any>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id ?? user.ID,
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        role: user.role ?? "",
        status: user.status ?? "",
        city: user.cityState ?? "",
        postalCode: user.postalCode ?? "",
        country: user.country ?? "",
        // social links: accept both snake_case and camelCase names
        socialFacebook: user.social_facebook ?? user.socialFacebook ?? "",
        socialX: user.social_x ?? user.socialX ?? "",
        socialLinkedin: user.social_linkedin ?? user.socialLinkedin ?? "",
        socialInstagram: user.social_instagram ?? user.socialInstagram ?? "",
      });

      const url =
        user.profileImageUrl ??
        user.profile_image_url ??
        user.profile_image ??
        user.profileImage ??
        null;

      // if backend returned key instead of URL, try to build using BASE_URL
      if (url && !url.startsWith("http")) {
        setPreviewUrl(`${BASE_IMAGE_URL}/uploads/profile-images/${url}`);
      } else {
        setPreviewUrl(url);
      }
    }
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p: any) => ({ ...p, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      // Build FormData if file present, else use JSON PATCH
      if (selectedFile) {
        const fd = new FormData();
        fd.append("name", formData.name || "");
        fd.append("email", formData.email || "");
        fd.append("phone", formData.phone || "");
        fd.append("role", formData.role || "");
        fd.append("status", formData.status ?? "");
        fd.append("socialFacebook", formData.socialFacebook || "");
        fd.append("socialX", formData.socialX || "");
        fd.append("socialLinkedin", formData.socialLinkedin || "");
        fd.append("socialInstagram", formData.socialInstagram || "");
        fd.append("profile_image", selectedFile);

        const res = await fetch(`${BASE_URL}users/${formData.id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });

        if (!res.ok) throw new Error("Failed to update user with image");
        const result = await res.json();
        console.log("Updated with image:", result);
      } else {
        const res = await fetch(`${BASE_URL}users/${formData.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            status: formData.status,
            socialFacebook: formData.socialFacebook,
            socialX: formData.socialX,
            socialLinkedin: formData.socialLinkedin,
            socialInstagram: formData.socialInstagram,
          }),
        });
        if (!res.ok) throw new Error("Failed to update user");
        const result = await res.json();
        console.log("Updated:", result);
      }

      if (onUpdated) onUpdated();
      closeModal();
    } catch (err) {
      console.error("Update failed:", err);
      // show toast or UI error if desired
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img
                src={previewUrl || "/images/user/owner.jpg"}
                alt="user"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {formData.name}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.role}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.city || formData.country || formData.postalCode
                    ? formData.city +
                      ", " +
                      formData.country +
                      ", " +
                      formData.postalCode
                    : "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 order-2 grow xl:order-3 xl:justify-end">
              {/* Facebook */}
              <a
                href={
                  formData.socialFacebook ||
                  user?.social_facebook ||
                  user?.socialFacebook ||
                  "#"
                }
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center 
               hover:bg-blue-600 hover:text-white transition-all duration-200"
              >
                <Facebook className="w-5 h-5" />
              </a>

              {/* X / Twitter */}
              <a
                href={
                  formData.socialX || user?.social_x || user?.socialX || "#"
                }
                target="_blank"
                rel="noreferrer"
                aria-label="X (Twitter)"
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center 
               hover:bg-black hover:text-white transition-all duration-200"
              >
                <svg
                  className="fill-current w-5 h-5"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M15.1708 1.875H17.9274L11.9049 8.75833L18.9899 18.125H13.4424L9.09742 12.4442L4.12578 18.125H1.36745L7.80912 10.7625L1.01245 1.875H6.70078L10.6283 7.0675L15.1708 1.875ZM14.2033 16.475H15.7308L5.87078 3.43833H4.23162L14.2033 16.475Z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href={
                  formData.socialLinkedin ||
                  user?.social_linkedin ||
                  user?.socialLinkedin ||
                  "#"
                }
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center 
               hover:bg-blue-700 hover:text-white transition-all duration-200"
              >
                <Linkedin className="w-5 h-5" />
              </a>

              {/* Instagram */}
              <a
                href={
                  formData.socialInstagram ||
                  user?.social_instagram ||
                  user?.socialInstagram ||
                  "#"
                }
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center 
               hover:bg-pink-600 hover:text-white transition-all duration-200"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <button onClick={openModal} className="...">
            <Pencil />
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>

          <form className="flex flex-col" onSubmit={handleSave}>
            <div className="custom-scrollbar overflow-y-auto px-2 pb-3">
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Photo
                </h5>
                <div>
                  <Label>Upload Image</Label>
                  <FileInput
                    onChange={handleFileChange}
                    className="custom-class"
                  />
                </div>
              </div>

              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Social Links
                </h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Facebook</Label>
                    <Input
                      type="text"
                      name="socialFacebook"
                      value={formData.socialFacebook}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label>X.com</Label>
                    <Input
                      type="text"
                      name="socialX"
                      value={formData.socialX}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label>Linkedin</Label>
                    <Input
                      type="text"
                      name="socialLinkedin"
                      value={formData.socialLinkedin}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label>Instagram</Label>
                    <Input
                      type="text"
                      name="socialInstagram"
                      value={formData.socialInstagram}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label>Role</Label>
                    <Input
                      type="text"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      name="email"
                      disabled
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label>Phone</Label>
                    <Input
                      type="text"
                      name="phone"
                      disabled
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div> */}
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
