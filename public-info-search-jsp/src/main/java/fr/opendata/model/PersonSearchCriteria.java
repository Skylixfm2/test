package fr.opendata.model;

public class PersonSearchCriteria {
    private String q;
    private String lastName;
    private String firstName;
    private String gender;
    private String city;
    private String address;
    private String postalCode;
    private String role;
    private String company;
    private String sort = "last_name";
    private String dir = "asc";
    private int page = 1;
    private int pageSize = 20;

    public String getQ() { return q; }
    public void setQ(String q) { this.q = clean(q); }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = clean(lastName); }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = clean(firstName); }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = clean(gender); }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = clean(city); }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = clean(address); }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = clean(postalCode); }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = clean(role); }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = clean(company); }
    public String getSort() { return sort; }
    public void setSort(String sort) {
        if (sort != null && sort.matches("last_name|first_name|gender|birth_date|postal_code|city|role|company")) this.sort = sort;
    }
    public String getDir() { return dir; }
    public void setDir(String dir) { this.dir = "desc".equalsIgnoreCase(dir) ? "desc" : "asc"; }
    public int getPage() { return page; }
    public void setPage(int page) { this.page = Math.max(1, page); }
    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = Math.min(100, Math.max(5, pageSize)); }
    public int offset() { return (page - 1) * pageSize; }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
